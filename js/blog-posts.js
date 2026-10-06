import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase.js";

export async function getPublishedPosts() {
  const publishedPosts = query(collection(db, "posts"), where("status", "==", "published"));
  const snapshot = await getDocs(publishedPosts);
  return snapshot.docs
    .map((post) => ({ id: post.id, ...post.data() }))
    .sort((first, second) => (second.publishedAt?.toMillis?.() ?? 0) - (first.publishedAt?.toMillis?.() ?? 0));
}

export function formatPostDate(timestamp, options = { year: "numeric", month: "long", day: "numeric" }) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "";
  return new Intl.DateTimeFormat("en", options).format(timestamp.toDate());
}

export function renderPostCard(post) {
  const card = document.createElement("a");
  card.className = "article-card";
  card.href = `blog.html?post=${encodeURIComponent(post.id)}`;

  const meta = document.createElement("div");
  meta.className = "article-meta";
  const category = document.createElement("span");
  category.textContent = post.category;
  const time = document.createElement("time");
  time.dateTime = post.publishedAt?.toDate?.().toISOString() ?? "";
  time.textContent = formatPostDate(post.publishedAt, { year: "numeric", month: "short" });
  meta.append(category, time);

  const heading = document.createElement("h3");
  heading.textContent = post.title;
  const excerpt = document.createElement("p");
  excerpt.textContent = post.excerpt;
  const readLink = document.createElement("span");
  readLink.className = "article-link";
  readLink.append(document.createTextNode("Read article "));
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  readLink.append(arrow);
  card.append(meta, heading, excerpt, readLink);
  return card;
}
