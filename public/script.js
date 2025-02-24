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


let discountApplied = false;
let referralCode = "";

function applyReferralCode() {
    const code = document.getElementById("referral-code").value.trim();
    fetch(`${backendUrl}/validate-referral`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.valid) {
            discountApplied = true;
            referralCode = code;
            let discountedAmount = selectedAmount * 0.8;
            document.getElementById("selected-plan-amount").textContent = `Amount: ₹${discountedAmount}`;
            generateQRCode(discountedAmount);
            document.getElementById("referral-status").textContent = "Referral code applied!";
            document.getElementById("referral-status").style.color = "green";
        } else {
            document.getElementById("referral-status").textContent = "Invalid referral code.";
            document.getElementById("referral-status").style.color = "red";
        }
        document.getElementById("referral-status").style.display = "block";
    })
    .catch(() => {
        document.getElementById("referral-status").textContent = "Error validating referral code.";
        document.getElementById("referral-status").style.color = "red";
        document.getElementById("referral-status").style.display = "block";
    });
}
