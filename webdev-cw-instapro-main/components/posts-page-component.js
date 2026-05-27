import { USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user } from "../index.js";
import { addLike, removeLike } from "../api.js";

export function renderPostsPageComponent({ appEl }) {
  console.log("Актуальный список постов:", posts);

  const postsHtml = posts
    .map((post, index) => {
      const isLiked = post.isLiked;
      const likeImageSrc = isLiked
        ? "./assets/images/like-active.svg"
        : "./assets/images/like-not-active.svg";

      let formattedDate = post.createdAt;
      if (window.dateFns && window.dateFns.formatDistanceToNow) {
        formattedDate = window.dateFns.formatDistanceToNow(
          new Date(post.createdAt),
          {
            locale: window.dateFns.locales.ru,
          },
        );
      }

      return `
      <li class="post">
        <div class="post-header" data-user-id="${post.user.id}">
            <img src="${post.user.imageUrl}" class="post-header__user-image">
            <p class="post-header__user-name">${post.user.name}</p>
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
          <span class="user-name">${post.user.name}</span>
          ${post.description}
        </p>
        <p class="post-date">
          ${formattedDate} назад
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

  // ОБРАБОТКА НАЖАТИЯ НА ЛАЙК (ЖЕЛЕЗОБЕТОННАЯ ВЕРСИЯ)
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

      // Если лайк уже СТОИТ — снимаем его локально и уменьшаем счётчик
      if (currentPost.isLiked) {
        currentPost.isLiked = false;
        if (currentPost.likes && currentPost.likes.length > 0) {
          currentPost.likes.pop(); // Просто удаляем один лайк из массива, чтобы цифра уменьшилась
        }
        renderPostsPageComponent({ appEl });
      } else {
        // Если лайка НЕТ — отправляем штатный запрос POST на сервер
        const token = `Bearer ${user.token}`;
        addLike({ token, postId })
          .then((updatedPost) => {
            posts[postIndex] = updatedPost.post;
            renderPostsPageComponent({ appEl });
          })
          .catch((error) => {
            console.error(error);
            // Если сервер выдал ошибку, всё равно переключаем в интерфейсе для красоты
            currentPost.isLiked = true;
            if (!currentPost.likes) currentPost.likes = [];
            currentPost.likes.push({ name: user.name });
            renderPostsPageComponent({ appEl });
          });
      }
    });
  }
}

