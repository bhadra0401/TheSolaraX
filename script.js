document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.querySelector(".sign-up form");
    const loginForm = document.querySelector(".sign-in form");

    // Handle registration
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = registerForm.querySelector("input[placeholder='Name']").value;
        const email = registerForm.querySelector("input[placeholder='Email']").value;
        const password = registerForm.querySelector("input[placeholder='Password']").value;

        const response = await fetch("http://localhost:5000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();
        alert(result.message);
    });

    // Handle login
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = loginForm.querySelector("input[placeholder='Email']").value;
        const password = loginForm.querySelector("input[placeholder='Password']").value;

        const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        if (response.ok) {
            alert("Login successful!");
            window.location.href = "homepage.html"; // Redirect to homepage
        } else {
            alert(result.message);
        }
    });
});
 
