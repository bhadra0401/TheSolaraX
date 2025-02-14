document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const container = document.getElementById("container");
  const registerBtn = document.getElementById("register");
  const loginBtn = document.getElementById("login");

  // Toggle Signup & Login
  registerBtn.addEventListener("click", () => container.classList.add("active"));
  loginBtn.addEventListener("click", () => container.classList.remove("active"));

  // ✅ Signup API Call
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();

    if (!name || !email || !password) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Signup failed.");
      }

      alert("Signup successful! Now login.");
      container.classList.remove("active"); // Switch to login form
    } catch (error) {
      alert("Error: " + error.message);
    }
  });

  // ✅ Login API Call
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Invalid credentials.");
      }

      localStorage.setItem("token", data.token);
      alert("Login successful! Redirecting...");
      window.location.href = "homepage.html";
    } catch (error) {
      alert("Error: " + error.message);
    }
  });

  // ✅ Ensure user is authenticated
  const token = localStorage.getItem("token");
  if (!token && window.location.pathname !== "/index.html") {
    window.location.href = "index.html";
  }

  // ✅ Fetch User Profile
  if (window.location.pathname === "/profile.html") {
    fetch("/auth/profile", {
      headers: { "Authorization": token }
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById("username").textContent = data.name;
      document.getElementById("useremail").textContent = data.email;
    })
    .catch(() => alert("Error fetching profile details."));
  }

  // ✅ Update Password
  if (window.location.pathname === "/profile.html") {
    document.getElementById("update-password-btn").addEventListener("click", function () {
      const newPassword = document.getElementById("new-password").value;

      fetch("/auth/update-password", {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: newPassword })
      })
      .then(response => response.json())
      .then(data => alert(data.msg))
      .catch(() => alert("Error updating password."));
    });
  }

  // ✅ Handle Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    });
  }

  // ✅ Fetch Payment Status
  if (window.location.pathname === "/payments.html") {
    fetch("/payment-status", {
      headers: { "Authorization": token }
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById("payment-status").textContent = data.paymentStatus || "Not Paid";
    })
    .catch(() => alert("Error fetching payment status."));
  }

  // ✅ Razorpay Payment Integration
  if (window.location.pathname === "/plans.html") {
    document.querySelectorAll(".choose-btn").forEach(button => {
      button.addEventListener("click", function () {
        const planAmount = this.getAttribute("data-amount");

        fetch("/create-order", {
          method: "POST",
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ amount: planAmount })
        })
        .then(response => response.json())
        .then(order => {
          var options = {
            "key": "YOUR_RAZORPAY_KEY",
            "amount": order.amount,
            "currency": "INR",
            "name": "Your Company",
            "description": "Subscription Payment",
            "order_id": order.id,
            "handler": function (response) {
              alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            },
            "prefill": {
              "name": "User Name",
              "email": "user@example.com",
              "contact": "9876543210"
            },
            "theme": { "color": "#6a5acd" }
          };

          var rzp1 = new Razorpay(options);
          rzp1.open();
        })
        .catch(() => alert("Error initiating payment."));
      });
    });
  }
});
