import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";
import { formatPostDate, getPublishedPosts, renderPostCard } from "./blog-posts.js";

const postsContainer = document.querySelector("#blog-posts");
const backLink = document.querySelector("#blog-back");
const params = new URLSearchParams(window.location.search);
const selectedPostId = params.get("post");

function showMessage(text) {
  postsContainer.replaceChildren();
  const message = document.createElement("p");
  message.className = "blog-message";
  message.textContent = text;
  postsContainer.append(message);
}

async function loadPosts() {
  if (selectedPostId) {
    backLink.hidden = false;
    const snapshot = await getDoc(doc(db, "posts", selectedPostId));
    if (!snapshot.exists() || snapshot.data().status !== "published") {
      showMessage("That post could not be found.");
      return;
    }

    const post = snapshot.data();
    postsContainer.classList.add("blog-detail");
    const article = document.createElement("article");
    article.className = "blog-article";
    const category = document.createElement("p");
    category.className = "eyebrow";
    category.textContent = post.category;
    const heading = document.createElement("h1");
    heading.textContent = post.title;
    const date = document.createElement("time");
    date.className = "blog-article-date";
    date.dateTime = post.publishedAt?.toDate?.().toISOString() ?? "";
    date.textContent = formatPostDate(post.publishedAt);
    const body = document.createElement("div");
    body.className = "blog-article-body";
    body.textContent = post.content;
    article.append(category, heading, date, body);
    postsContainer.replaceChildren(article);
    return;
  }

  const posts = await getPublishedPosts();

  if (!posts.length) {
    showMessage("No posts published yet. Check back soon.");
    return;
  }

  postsContainer.replaceChildren(...posts.map(renderPostCard));
}

loadPosts().catch((error) => {
  console.error("Could not load blog posts.", error);
  showMessage("We couldn’t load the posts right now. Please try again later.");
});
