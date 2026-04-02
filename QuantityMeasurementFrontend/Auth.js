const API_BASE_URL = "http://localhost:5001";

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to home
  if (localStorage.getItem("token")) {
    window.location.href = "Index.html";
    return;
  }
  document
    .getElementById("signupPassword")
    ?.addEventListener("input", checkPasswordStrength);
});

function switchToLogin() {
  document.getElementById("loginToggle").classList.add("active");
  document.getElementById("signupToggle").classList.remove("active");
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("signupForm").style.display = "none";
}

function switchToSignup() {
  document.getElementById("loginToggle").classList.remove("active");
  document.getElementById("signupToggle").classList.add("active");
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === "password" ? "text" : "password";
}

function checkPasswordStrength() {
  const pw = document.getElementById("signupPassword").value;
  const div = document.getElementById("passwordStrength");
  if (!pw) {
    div.innerHTML = "";
    return;
  }
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  const cls =
    s <= 2 ? "strength-weak" : s <= 4 ? "strength-medium" : "strength-strong";
  div.innerHTML = `<div class="password-strength-bar ${cls}"></div>`;
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) {
    showToast("Please fill all fields", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    showToast("Login successful!", "success");

    // Flush any ops queued before login (same-tab, no storage event fires)
    await flushPendingOperations();

    setTimeout(() => (window.location.href = "Index.html"), 1000);
  } catch (err) {
    showToast(err.message || "Invalid email or password", "error");
  }
}

async function handleSignup() {
  const username = document.getElementById("signupUsername").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const agreed = document.getElementById("agreeTerms").checked;

  if (!username || !email || !password) {
    showToast("Please fill all fields", "error");
    return;
  }
  if (!agreed) {
    showToast("Please agree to terms", "error");
    return;
  }
  if (password.length < 8) {
    showToast("Password must be at least 8 characters", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    showToast("Account created!", "success");

    await flushPendingOperations();

    setTimeout(() => (window.location.href = "Index.html"), 1000);
  } catch (err) {
    showToast(err.message || "Registration failed", "error");
  }
}

function handleGoogleLogin() {
  // Redirect to backend Google OAuth initiation endpoint
  window.location.href = `${API_BASE_URL}/api/Auth/google-login`;
}

// Flush ops queued before login (called directly after setting the token)
async function flushPendingOperations() {
  const pending = (() => {
    try {
      return JSON.parse(localStorage.getItem("pendingOperations") || "[]");
    } catch {
      return [];
    }
  })();
  if (!pending.length) return;
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/QuantityMeasurement/save-batch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pending),
      },
    );
    if (res.ok) {
      localStorage.removeItem("pendingOperations");
      showToast(`${pending.length} queued operation(s) saved!`, "success");
    }
  } catch (e) {
    console.error("Flush error:", e);
  }
}

function showToast(msg, type = "success") {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

document.addEventListener("keypress", (e) => {
  if (e.key !== "Enter") return;
  const lf = document.getElementById("loginForm");
  const sf = document.getElementById("signupForm");
  if (lf.style.display !== "none") handleLogin();
  else if (sf.style.display !== "none") handleSignup();
});
