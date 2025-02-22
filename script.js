const backendUrl = "https://thesolarax.onrender.com"; // ✅ Updated backend URL

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
  fetch(`${backendUrl}/auth/profile`, {
      headers: { "Authorization": `Bearer ${token}` }
  })
  .then(response => {
      if (response.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "index.html";
          return;
      }
      return response.json();
  })
  .then(data => {
      document.getElementById("profileLink").textContent = data.name || "Profile";
  })
  .catch(error => {
      alert("Error fetching profile. Please try again.");
      localStorage.removeItem("token");
      window.location.href = "index.html";
  });
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("selectedAmount"); // ✅ Clear stored amount
  localStorage.removeItem("selectedPlanName"); // ✅ Clear stored plan name
  localStorage.removeItem("selectedCompletionPercentage"); // ✅ Clear stored completion percentage
  window.location.href = "index.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", logout);