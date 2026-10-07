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

function requiredElement(selector) {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Required admin element "${selector}" is missing.`);
  }
  return element;
}

function logFirebaseError(context, error) {
  const details = error && typeof error === "object" ? error : {};
  console.error(context, {
    code: "code" in details ? details.code : "unknown",
    message: "message" in details ? details.message : String(error)
  }, error);
}

const gate = requiredElement("#admin-gate");
const gateTitle = requiredElement("#admin-gate-title");
const gateMessage = requiredElement("#admin-gate-message");
const loginLink = requiredElement("#admin-login");
const gateSignout = requiredElement("#admin-gate-signout");
const shell = requiredElement("#admin-shell");
const message = requiredElement("#admin-message");
const form = document.querySelector("#post-form");
if (!(form instanceof HTMLFormElement)) {
  throw new Error('Required admin form "#post-form" is missing.');
}
const panels = [...document.querySelectorAll(".admin-panel")];
const tabs = [...document.querySelectorAll("[data-admin-tab]")];
const messagesList = requiredElement("#contact-messages");
const unreadCount = requiredElement("#contact-unread-count");
const statTotal = requiredElement("#stat-total");
const statPublished = requiredElement("#stat-published");
const statDrafts = requiredElement("#stat-drafts");
const statMessages = requiredElement("#stat-messages");
const recentPosts = requiredElement("#recent-posts");
const allPosts = requiredElement("#all-posts");
const editorTitle = requiredElement("#editor-title");
const newPostLink = requiredElement("#new-post-link");
const cancelEditor = requiredElement("#cancel-editor");
const adminSignout = requiredElement("#admin-signout");
const adminUser = requiredElement("#admin-user");
const overviewInboxSummary = document.querySelector("#overview-inbox-summary");
const overviewInboxPreview = document.querySelector("#overview-inbox-preview");
let posts = [];
let contactMessages = [];

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
  statTotal.textContent = String(posts.length);
  statPublished.textContent = String(posts.filter((post) => post.status === "published").length);
  statDrafts.textContent = String(posts.filter((post) => post.status === "draft").length);

  for (const container of [recentPosts, allPosts]) {
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

function formatMessageDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(timestamp.toDate());
}

function makeContactMessageRow(contactMessage) {
  const row = document.createElement("article");
  row.className = "admin-message-row";
  row.dataset.read = String(contactMessage.read === true);

  const header = document.createElement("div");
  header.className = "admin-message-header";
  const sender = document.createElement("div");
  sender.className = "admin-post-info";
  const nameLabel = document.createElement("span");
  nameLabel.className = "admin-message-field-label";
  nameLabel.textContent = "Name";
  const name = document.createElement("h3");
  name.textContent = contactMessage.name;
  const emailLabel = document.createElement("span");
  emailLabel.className = "admin-message-field-label";
  emailLabel.textContent = "Email";
  const email = document.createElement("a");
  email.className = "admin-message-email";
  email.href = `mailto:${encodeURIComponent(contactMessage.email)}`;
  email.textContent = contactMessage.email;
  sender.append(nameLabel, name, emailLabel, email);
  header.append(sender);

  const meta = document.createElement("div");
  meta.className = "admin-message-meta";
  const badge = document.createElement("span");
  badge.className = `contact-status-badge${contactMessage.read === true ? "" : " is-unread"}`;
  badge.textContent = contactMessage.read === true ? "Read" : "New";
  const date = document.createElement("time");
  date.textContent = formatMessageDate(contactMessage.createdAt);
  if (contactMessage.createdAt && typeof contactMessage.createdAt.toDate === "function") {
    date.dateTime = contactMessage.createdAt.toDate().toISOString();
  }
  meta.append(badge, date);

  const body = document.createElement("p");
  body.className = "admin-message-body";
  body.textContent = contactMessage.message;

  const actions = document.createElement("div");
  actions.className = "admin-post-actions";
  const readButton = document.createElement("button");
  readButton.className = "text-button";
  readButton.type = "button";
  readButton.textContent = contactMessage.read === true ? "Mark unread" : "Mark read";
  readButton.addEventListener("click", () => updateContactMessage(contactMessage, { read: contactMessage.read !== true }));
  const deleteButton = document.createElement("button");
  deleteButton.className = "text-button text-button-danger";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => removeContactMessage(contactMessage));
  actions.append(readButton, deleteButton);

  row.append(header, meta, body, actions);
  return row;
}

function renderContactMessages() {
  contactMessages.sort((first, second) => (second.createdAt?.toMillis?.() ?? 0) - (first.createdAt?.toMillis?.() ?? 0));
  const unread = contactMessages.filter((contactMessage) => contactMessage.read !== true).length;
  unreadCount.textContent = String(unread);
  unreadCount.hidden = unread === 0;
  statMessages.textContent = String(contactMessages.length);
  if (overviewInboxSummary) {
    overviewInboxSummary.textContent = `${contactMessages.length} ${contactMessages.length === 1 ? "message" : "messages"} · ${unread} unread`;
  }
  messagesList.replaceChildren();
  overviewInboxPreview?.replaceChildren();

  if (!contactMessages.length) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Your inbox is empty. New portfolio inquiries will appear here.";
    messagesList.append(empty);
    if (overviewInboxPreview) {
      const overviewEmpty = document.createElement("p");
      overviewEmpty.className = "admin-empty";
      overviewEmpty.textContent = "New portfolio inquiries will appear here.";
      overviewInboxPreview.append(overviewEmpty);
    }
    return;
  }
  messagesList.append(...contactMessages.map(makeContactMessageRow));

  if (!overviewInboxPreview) return;
  for (const contactMessage of contactMessages.slice(0, 3)) {
    const preview = document.createElement("article");
    preview.className = "admin-inbox-preview-row";
    const sender = document.createElement("div");
    sender.className = "admin-inbox-preview-sender";
    const name = document.createElement("strong");
    name.textContent = contactMessage.name;
    const email = document.createElement("a");
    email.href = `mailto:${encodeURIComponent(contactMessage.email)}`;
    email.textContent = contactMessage.email;
    sender.append(name, email);

    const excerpt = document.createElement("p");
    excerpt.textContent = contactMessage.message;
    const date = document.createElement("time");
    date.textContent = formatMessageDate(contactMessage.createdAt);
    if (contactMessage.createdAt && typeof contactMessage.createdAt.toDate === "function") {
      date.dateTime = contactMessage.createdAt.toDate().toISOString();
    }
    preview.append(sender, excerpt, date);
    overviewInboxPreview.append(preview);
  }
}

async function refreshPosts() {
  const snapshot = await getDocs(query(collection(db, "posts"), orderBy("updatedAt", "desc")));
  posts = snapshot.docs.map((post) => ({ id: post.id, ...post.data() }));
  renderPosts();
}

async function refreshContactMessages() {
  const snapshot = await getDocs(collection(db, "contactMessages"));
  contactMessages = snapshot.docs.map((contactMessage) => ({ id: contactMessage.id, ...contactMessage.data() }));
  renderContactMessages();
}

async function updateContactMessage(contactMessage, changes) {
  try {
    await updateDoc(doc(db, "contactMessages", contactMessage.id), changes);
    await refreshContactMessages();
    showMessage(changes.read ? "Message marked as read." : "Message marked as unread.", "success");
  } catch (error) {
    logFirebaseError("Could not update the contact message.", error);
    showMessage("The message couldn’t be updated. Please try again.");
  }
}

async function removeContactMessage(contactMessage) {
  if (!window.confirm(`Delete the message from ${contactMessage.name}? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "contactMessages", contactMessage.id));
    await refreshContactMessages();
    showMessage("Message deleted.", "success");
  } catch (error) {
    logFirebaseError("Could not delete the contact message.", error);
    showMessage("The message couldn’t be deleted. Please try again.");
  }
}

function editPost(post) {
  form.elements.postId.value = post.id;
  form.elements.title.value = post.title;
  form.elements.category.value = post.category;
  form.elements.excerpt.value = post.excerpt;
  form.elements.content.value = post.content;
  editorTitle.textContent = "Edit post";
  setPanel("editor");
  message.hidden = true;
}

function resetEditor() {
  form.reset();
  form.elements.postId.value = "";
  editorTitle.textContent = "New post";
}

async function removePost(post) {
  if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, "posts", post.id));
    await refreshPosts();
    showMessage("Post deleted.", "success");
  } catch (error) {
    logFirebaseError("Could not delete the blog post.", error);
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
    logFirebaseError("Could not save the blog post.", error);
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
newPostLink.addEventListener("click", () => {
  resetEditor();
  message.hidden = true;
  setPanel("editor");
});
cancelEditor.addEventListener("click", () => {
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
adminSignout.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    logFirebaseError("Could not sign out.", error);
    showMessage("You couldn’t be signed out. Please try again.");
  }
});
gateSignout.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    logFirebaseError("Could not sign out.", error);
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
  adminUser.textContent = user.displayName || user.email;
  try {
    await refreshPosts();
  } catch (error) {
    logFirebaseError("Could not load dashboard posts.", error);
    showMessage("Your dashboard couldn’t load posts. Check that Firestore is enabled and its rules are published.");
  }
  try {
    await refreshContactMessages();
  } catch (error) {
    logFirebaseError("Could not load contact messages.", error);
    showMessage("Your contact inbox couldn’t load. Check that Firestore is enabled and its rules are published.");
  }
}, (error) => {
  logFirebaseError("Could not verify the signed-in account.", error);
  gate.hidden = false;
  shell.hidden = true;
  showGate("We couldn’t verify your account.", "Check your connection, then reload this page.");
});
