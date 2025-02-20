document.addEventListener("DOMContentLoaded", function () {
  const userToken = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");
  const isAdmin = localStorage.getItem("role") === "admin";

  if (userToken) {
      fetchUserProfile();
  }
  if (adminToken && isAdmin) {
      fetchAdminDashboard();
  }
});

function fetchUserProfile() {
  const token = localStorage.getItem("token");
  fetch("https://thesolarax.onrender.com/auth/profile", {
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

function fetchAdminDashboard() {
  const token = localStorage.getItem("adminToken");
  fetch("https://thesolarax.onrender.com/admin/payment-requests", {
      headers: { "Authorization": `Bearer ${token}` }
  })
  .then(response => response.json())
  .then(data => {
      console.log("Admin Dashboard Data:", data);
  })
  .catch(() => {
      localStorage.removeItem("adminToken");
      window.location.href = "index.html";
  });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);
