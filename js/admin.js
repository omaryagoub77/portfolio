import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase.js";

const ADMIN_EMAIL = "omaryagoub77@gmail.com";
const gate = document.querySelector("#admin-gate");
const gateTitle = document.querySelector("#admin-gate-title");
const gateMessage = document.querySelector("#admin-gate-message");
const loginLink = document.querySelector("#admin-login");
const gateSignout = document.querySelector("#admin-gate-signout");
const shell = document.querySelector("#admin-shell");
const message = document.querySelector("#admin-message");
const form = document.querySelector("#post-form");
const panels = [...document.querySelectorAll(".admin-panel")];
const tabs = [...document.querySelectorAll("[data-admin-tab]")];
let posts = [];

function showMessage(text, state = "error") {
  message.textContent = text;
  message.dataset.state = state;
  message.hidden = false;
}

function showGate(title, text, allowSignIn = false) {
  gateTitle.textContent = title;
  gateMessage.textContent = text;
  loginLink.hidden = !allowSignIn;
  gateSignout.hidden = allowSignIn;
}

function setPanel(name) {
  panels.forEach((panel) => {
    panel.hidden = panel.id !== `${name}-panel`;
  });
  tabs.forEach((tab) => {
    const isActive = tab.dataset.adminTab === name;
    tab.classList.toggle("is-active", isActive);
    if (tab instanceof HTMLAnchorElement) {
      isActive ? tab.setAttribute("aria-current", "page") : tab.removeAttribute("aria-current");
    }
  });
  if (name === "editor") form.elements.title.focus();
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "Just now";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(timestamp.toDate());
}

function makePostRow(post) {
  const row = document.createElement("article");
  row.className = "admin-post-row";
  const details = document.createElement("div");
  details.className = "admin-post-info";
  const title = document.createElement("h3");
  title.textContent = post.title;
  const meta = document.createElement("p");
  meta.textContent = `${post.category} · Updated ${formatDate(post.updatedAt)}`;
  details.append(title, meta);

  const status = document.createElement("span");
  status.className = `post-status post-status-${post.status}`;
  status.textContent = post.status === "published" ? "Published" : "Draft";
  const actions = document.createElement("div");
  actions.className = "admin-post-actions";
  const editButton = document.createElement("button");
  editButton.className = "text-button";
  editButton.type = "button";
  editButton.textContent = "Edit";
  editButton.addEventListener("click", () => editPost(post));
  const deleteButton = document.createElement("button");
  deleteButton.className = "text-button text-button-danger";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => removePost(post));
  actions.append(editButton, deleteButton);
  row.append(details, status, actions);
  return row;
}

function renderPosts() {
  const sorted = [...posts].sort((first, second) => (second.updatedAt?.toMillis?.() ?? 0) - (first.updatedAt?.toMillis?.() ?? 0));
  document.querySelector("#stat-total").textContent = String(posts.length);
  document.querySelector("#stat-published").textContent = String(posts.filter((post) => post.status === "published").length);
  document.querySelector("#stat-drafts").textContent = String(posts.filter((post) => post.status === "draft").length);

  for (const container of [document.querySelector("#recent-posts"), document.querySelector("#all-posts")]) {
    container.replaceChildren();
    const visiblePosts = container.id === "recent-posts" ? sorted.slice(0, 5) : sorted;
    if (!visiblePosts.length) {
      const empty = document.createElement("p");
      empty.className = "admin-empty";
      empty.textContent = "You haven’t written a post yet. Start with your first idea.";
      container.append(empty);
      continue;
    }
    container.append(...visiblePosts.map(makePostRow));
  }
}

async function refreshPosts() {
  const snapshot = await getDocs(query(collection(db, "posts"), orderBy("updatedAt", "desc")));
  posts = snapshot.docs.map((post) => ({ id: post.id, ...post.data() }));
  renderPosts();
}

function editPost(post) {
  form.elements.postId.value = post.id;
  form.elements.title.value = post.title;
  form.elements.category.value = post.category;
  form.elements.excerpt.value = post.excerpt;
  form.elements.content.value = post.content;
  document.querySelector("#editor-title").textContent = "Edit post";
  setPanel("editor");
  message.hidden = true;
}

function resetEditor() {
  form.reset();
  form.elements.postId.value = "";
  document.querySelector("#editor-title").textContent = "New post";
}

async function removePost(post) {
  if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "posts", post.id));
    await refreshPosts();
    showMessage("Post deleted.", "success");
  } catch (error) {
    console.error("Could not delete the blog post.", error);
    showMessage("The post couldn’t be deleted. Please try again.");
  }
}

async function savePost(event) {
  event.preventDefault();
  const action = event.submitter?.value;
  if (action !== "draft" && action !== "publish") {
    showMessage("Choose whether to save this post as a draft or publish it.");
    return;
  }

  const postId = form.elements.postId.value;
  const previousPost = posts.find((post) => post.id === postId);
  const status = action === "publish" ? "published" : "draft";
  const now = serverTimestamp();
  const post = {
    title: form.elements.title.value.trim(),
    category: form.elements.category.value.trim(),
    excerpt: form.elements.excerpt.value.trim(),
    content: form.elements.content.value.trim(),
    status,
    updatedAt: now
  };

  if (!post.title || !post.category || !post.excerpt || !post.content) {
    showMessage("Please complete every field before saving.");
    return;
  }

  const submitButtons = [...form.querySelectorAll('button[type="submit"]')];
  submitButtons.forEach((button) => { button.disabled = true; });
  try {
    if (postId) {
      if (status === "published" && previousPost?.status !== "published") {
        post.publishedAt = now;
      }
      await updateDoc(doc(db, "posts", postId), post);
    } else {
      post.createdAt = now;
      post.publishedAt = status === "published" ? now : null;
      await addDoc(collection(db, "posts"), post);
    }
    await refreshPosts();
    resetEditor();
    setPanel("dashboard");
    showMessage(status === "published" ? "Your post is live on the blog." : "Your draft has been saved.", "success");
  } catch (error) {
    console.error("Could not save the blog post.", error);
    showMessage("The post couldn’t be saved. Check your connection and try again.");
  } finally {
    submitButtons.forEach((button) => { button.disabled = false; });
  }
}

document.querySelectorAll("[data-open-editor]").forEach((button) => {
  button.addEventListener("click", () => {
    resetEditor();
    message.hidden = true;
    setPanel("editor");
  });
});
document.querySelector("#new-post-link").addEventListener("click", () => {
  resetEditor();
  message.hidden = true;
  setPanel("editor");
});
document.querySelector("#cancel-editor").addEventListener("click", () => {
  resetEditor();
  setPanel("dashboard");
});
tabs.forEach((tab) => {
  tab.addEventListener("click", (event) => {
    event.preventDefault();
    setPanel(tab.dataset.adminTab);
  });
});
form.addEventListener("submit", savePost);
document.querySelector("#admin-signout").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Could not sign out.", error);
    showMessage("You couldn’t be signed out. Please try again.");
  }
});
gateSignout.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Could not sign out.", error);
    gateMessage.textContent = "You couldn’t be signed out. Please try again.";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    gate.hidden = false;
    shell.hidden = true;
    showGate("Sign in to continue.", "This dashboard is only available to its owner.", true);
    return;
  }
  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    gate.hidden = false;
    shell.hidden = true;
    showGate("This account doesn’t have access.", "Sign in with the account authorized to manage this blog.");
    return;
  }
  if (!user.emailVerified) {
    gate.hidden = false;
    shell.hidden = true;
    showGate("Verify your email to continue.", "Open the verification link sent to your inbox, then sign in again.");
    return;
  }

  gate.hidden = true;
  shell.hidden = false;
  document.querySelector("#admin-user").textContent = user.displayName || user.email;
  try {
    await refreshPosts();
  } catch (error) {
    console.error("Could not load dashboard posts.", error);
    showMessage("Your dashboard couldn’t load posts. Check that Firestore is enabled and its rules are published.");
  }
}, (error) => {
  console.error("Could not verify the signed-in account.", error);
  gate.hidden = false;
  shell.hidden = true;
  showGate("We couldn’t verify your account.", "Check your connection, then reload this page.");
});
