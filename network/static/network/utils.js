function getCookie(name) {
  let cookieValue = null;

  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();

      if (cookie.substring(0, name.length + 1) === (name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }

  return cookieValue;
}

function exitEditAndUpdateInnerText(postId, newText) {
  const contentEl = document.querySelector(`#content-${postId}`);
  const postCard = document.querySelector(`#post-${postId}`);
  const editBtn = postCard.querySelector(".edit-btn");

  contentEl.innerText = newText;
  editBtn.disabled = false;
}

document.addEventListener("DOMContentLoaded", () => {

  // =====================
  // LIKE BUTTONS
  // =====================
  document.querySelectorAll(".like-btn").forEach(button => {
    button.onclick = () => {
      const postId = button.dataset.postId;

      fetch(`/like/${postId}`, {
        method: "PUT",
        headers: {
          "X-CSRFToken": getCookie("csrftoken")
        }
      })
      .then(response => response.json())
      .then(data => {
        const likesCount = document.querySelector(`#likes-count-${postId}`);

        likesCount.innerHTML = `${data.likes_count} likes`;

        button.innerHTML = data.liked ? "Unlike" : "Like";
      });
    };
  });

  // =====================
  // FOLLOW BUTTON
  // =====================
  const followBtn = document.querySelector("#follow-btn");

  if (followBtn) {
    followBtn.addEventListener("click", () => {
      const userId = followBtn.dataset.userId;

      fetch(`/follow/${userId}`, {
        method: "PUT",
        headers: {
          "X-CSRFToken": getCookie("csrftoken")
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.following) {
          followBtn.innerHTML = "Unfollow";
          followBtn.classList.remove("btn-primary");
          followBtn.classList.add("btn-outline-danger");
        } else {
          followBtn.innerHTML = "Follow";
          followBtn.classList.remove("btn-outline-danger");
          followBtn.classList.add("btn-primary");
        }

        const followersCount = document.querySelector("#followers-count");
        if (followersCount) {
          followersCount.innerHTML = data.followers_count;
        }
      });
    });
  }

  // =====================
  // CLICK DELEGATION (EDIT + CANCEL)
  // =====================
  document.addEventListener("click", function (e) {

    // =====================
    // EDIT CLICK
    // =====================
    if (e.target.classList.contains("edit-btn")) {
      // disable edit button immediately
      e.target.disabled = true;

      const postId = e.target.dataset.id;
      const contentEl = document.querySelector(`#content-${postId}`);

      // store original safely
      contentEl.dataset.original = contentEl.innerText;
      const currentText = contentEl.innerText;

      contentEl.innerHTML = `
        <textarea class="form-control mb-2" id="textarea-${postId}">${currentText}</textarea>

        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-success rounded-pill px-3 save-btn" data-id="${postId}">
            Save
          </button>

          <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 cancel-btn" data-id="${postId}">
            Cancel
          </button>
        </div>
      `;
    }

    // =====================
    // CANCEL
    // =====================
    if (e.target.classList.contains("cancel-btn")) {
      const postId = e.target.dataset.id;
      const contentEl = document.querySelector(`#content-${postId}`);

      exitEditAndUpdateInnerText(postId, contentEl.dataset.original);

    }

    // =====================
    // SAVE 
    // =====================
    if (e.target.classList.contains("save-btn")) {
      const postId = e.target.dataset.id;
      const textarea = document.querySelector(`#textarea-${postId}`);
      const newContent = textarea.value;

      fetch(`/edit_post/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": getCookie("csrftoken")
        },
        body: `content=${encodeURIComponent(newContent)}`
      })
      .then(response => response.json())
      .then(data => {
        if (data.content) {
          exitEditAndUpdateInnerText(postId, data.content);
        }
      });
    }
  })
});