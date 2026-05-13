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

});