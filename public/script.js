document.addEventListener("DOMContentLoaded", function () {
  const userToken = localStorage.getItem("token");

  if (userToken) {
      fetchUserProfile();
  } else {
      window.location.href = "index.html";
  }
});

function fetchUserProfile() {
  const token = localStorage.getItem("token");
  fetch("/auth/profile", {
      headers: { "Authorization": `Bearer ${token}` }
  })
  .then(response => response.json())
  .then(data => {
      document.getElementById("profileLink").textContent = data.name || "Profile";
  })
  .catch(() => {
      localStorage.removeItem("token");
      window.location.href = "index.html";
  });
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);
