import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  const render = () => {
    let imageUrl = "";

    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Добавить новый пост</h3>
        <div class="form-inputs">
          <!-- Сюда будет встраиваться компонент загрузки фото -->
          <div class="upload-image-container"></div>
          
          <label class="form-label">
            Опишите фотографию:
            <textarea class="input textarea" id="description-input" rows="4"></textarea>
          </label>
          
          <button class="button" id="add-button">Добавить пост</button>
        </div>
      </div>
    </div>
  `;

    appEl.innerHTML = appHtml;

    // Рендерим шапку
    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    // Рендерим компонент загрузки изображения
    const uploadImageContainer = document.querySelector(
      ".upload-image-container",
    );

    if (uploadImageContainer) {
      renderUploadImageComponent({
        element: uploadImageContainer,
        onImageUrlChange(newImageUrl) {
          imageUrl = newImageUrl; // Сохраняем URL загруженного в облако фото
        },
      });
    }

    // Обработчик клика по кнопке добавления
    document.getElementById("add-button").addEventListener("click", () => {
      const descriptionInput = document.getElementById("description-input");

      if (!imageUrl) {
        alert("Пожалуйста, выберите и загрузите фотографию");
        return;
      }

      if (!descriptionInput.value.trim()) {
        alert("Пожалуйста, добавьте описание к посту");
        return;
      }

      // Передаем реальные данные в index.js
      onAddPostClick({
        description: descriptionInput.value.trim(),
        imageUrl: imageUrl,
      });
    });
  };

  render();
}

