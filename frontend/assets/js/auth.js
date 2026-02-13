import { api } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    // Tab Switching
    const loginTab = document.getElementById("loginTab");
    const signupTab = document.getElementById("signupTab");
    const extraFields = document.getElementById("extraFields");
    const passwordStrength = document.getElementById("passwordStrength");
    const submitBtn = document.getElementById("submitBtn");
    const form = document.getElementById("authForm");
    const errorMsg = document.getElementById("errorMsg");

    let isLogin = true;

    loginTab.addEventListener("click", () => {
        isLogin = true;
        loginTab.classList.add("active");
        signupTab.classList.remove("active");
        extraFields.style.display = "none";
        passwordStrength.style.display = "none";
        submitBtn.textContent = "Login";
    });

    signupTab.addEventListener("click", () => {
        isLogin = false;
        signupTab.classList.add("active");
        loginTab.classList.remove("active");
        extraFields.style.display = "block";
        passwordStrength.style.display = "block";
        submitBtn.textContent = "Sign Up";
    });

    // Form Submission
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const fullname = document.getElementById("fullname").value;

        try {
            let data;
            if (isLogin) {
                data = await api.login(email, password);
            } else {
                data = await api.signup(email, password, fullname);
            }

            if (data && data.access_token) {
                api.setToken(data.access_token);

                if (document.getElementById("rememberMe").checked) {
                    localStorage.setItem("remember_user", email);
                }

                window.location.href = "dashboard.html";
            }
        } catch (error) {
            showError(error.message);
        }
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = "block";
    }

    // Google Auth Logic (Wrapped)
    window.handleCredentialResponse = async (response) => {
        try {
            const data = await api.googleLogin(response.credential);
            if (data) {
                api.setToken(data.access_token);
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            showError("Google Login Failed: " + error.message);
        }
    };

    window.mockGoogleLogin = async () => {
        try {
            const data = await api.googleLogin("mock_token");
            if (data) {
                api.setToken(data.access_token);
                localStorage.setItem("remember_user", "google_user@example.com");
                window.location.href = "dashboard.html";
            }
        } catch (error) {
            showError("Mock Login Failed: " + error.message);
        }
    };
});
