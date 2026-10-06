import { getPublishedPosts, renderPostCard } from "./blog-posts.js";

const postsContainer = document.querySelector("#home-blog-posts");

function showMessage(text) {
  const message = document.createElement("p");
  message.className = "blog-message";
  message.textContent = text;
  postsContainer.replaceChildren(message);
}

async function loadHomePosts() {
  try {
    const posts = await getPublishedPosts();
    if (!posts.length) {
      showMessage("No posts published yet. Check back soon.");
      return;
    }

    postsContainer.replaceChildren(...posts.slice(0, 3).map(renderPostCard));
  } catch (error) {
    console.error("Could not load homepage blog posts.", error);
    showMessage("We couldn’t load the latest posts right now. Visit the blog to try again.");
  }
}

loadHomePosts();
