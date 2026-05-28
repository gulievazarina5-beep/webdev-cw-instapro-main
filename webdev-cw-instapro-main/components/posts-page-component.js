import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike } from "../api.js";

// Функция для безопасного экранирования HTML-тегов (Защита от XSS)
function escapeHtml(string) {
  return String(string)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderPostsPageComponent({ appEl }) {
  console.log("Актуальный список постов:", posts);

  const postsHtml = posts
    .map((post, index) => {
      const isLiked = post.isLiked;
      const likeImageSrc = isLiked
        ? "./assets/images/like-active.svg"
        : "./assets/images/like-not-active.svg";

      // Безопасное экранирование данных из API
      const safeUserName = escapeHtml(post.user.name);
      const safeDescription = escapeHtml(post.description);

      // Форматирование даты
      let formattedDate = post.createdAt;
      try {
        if (window.dateFns && window.dateFns.formatDistanceToNow) {
          const ruLocale =
            (window.dateFns.locale && window.dateFns.locale.ru) ||
            (window.dateFns.locales && window.dateFns.locales.ru);

          formattedDate = window.dateFns.formatDistanceToNow(
            new Date(post.createdAt),
            {
              locale: ruLocale,
              addSuffix: true,
            },
          );
        } else {
          // Если библиотека из CDN не загрузилась, используем красивый нативный формат: "27 мая 2026 г., 14:11"
          const postDate = new Date(post.createdAt);
          formattedDate = postDate.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (dateError) {
        console.error("Ошибка при обработке даты:", dateError);
      }

      return `
      <li class="post">
        <div class="post-header" data-user-id="${post.user.id}">
            <img src="${post.user.imageUrl}" class="post-header__user-image">
            <p class="post-header__user-name">${safeUserName}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" src="${post.imageUrl}">
        </div>
        <div class="post-likes">
          <button data-post-id="${post.id}" data-index="${index}" class="like-button">
            <img src="${likeImageSrc}">
          </button>
          <p class="post-likes-text">
            Нравится: <strong>${post.likes ? post.likes.length : 0}</strong>
          </p>
        </div>
        <p class="post-text">
          <span class="user-name">${safeUserName}</span>
          ${safeDescription}
        </p>
        <p class="post-date">
          ${formattedDate}
        </p>
      </li>
    `;
    })
    .join("");

  const appHtml = `
              <div class="page-container">
                <div class="header-container"></div>
                <ul class="posts">
                  ${postsHtml}
                </ul>
              </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

  // ОБРАБОТКА НАЖАТИЯ НА ЛАЙК
  for (let likeBtn of document.querySelectorAll(".like-button")) {
    likeBtn.addEventListener("click", () => {
      if (!user) {
        alert("Лайкать посты могут только авторизованные пользователи");
        return;
      }

      const postId = likeBtn.dataset.postId;
      const postIndex = Number(likeBtn.dataset.index);
      const currentPost = posts[postIndex];

      if (!currentPost) return;

      const token = `Bearer ${user.token}`;

      if (currentPost.isLiked) {
        removeLike({ token, postId })
          .then((updatedPost) => {
            posts[postIndex] = updatedPost.post
              ? updatedPost.post
              : updatedPost;
            renderPostsPageComponent({ appEl });
          })
          .catch((error) => {
            console.error("Ошибка при снятии лайка:", error);
            alert("Не удалось убрать лайк, попробуйте позже.");
          });
      } else {
        addLike({ token, postId })
          .then((updatedPost) => {
            posts[postIndex] = updatedPost.post
              ? updatedPost.post
              : updatedPost;
            renderPostsPageComponent({ appEl });
          })
          .catch((error) => {
            console.error("Ошибка при установке лайка:", error);
            alert("Не удалось поставить лайк, попробуйте позже.");
          });
      }
    });
  }
}
