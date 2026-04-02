const API_BASE_URL = "http://localhost:5001";

document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndLoadProfile();
});

function checkAuthAndLoadProfile() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "Auth.html";
    return;
  }
  loadProfile();
}

async function loadProfile() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(API_BASE_URL + "/api/User/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "Auth.html";
        return;
      }
      throw new Error("Failed to load profile");
    }

    const profile = await response.json();
    displayProfile(profile);
  } catch (error) {
    console.error("Error loading profile:", error);
    showToast("Failed to load profile", "error");
  }
}

function displayProfile(profile) {
  // Update profile header
  const username =
    profile.username || localStorage.getItem("username") || "User";
  const email = profile.email || "user@example.com";

  document.getElementById("profileAvatar").textContent = username
    .charAt(0)
    .toUpperCase();
  document.getElementById("profileName").textContent = username;
  document.getElementById("profileEmail").textContent = email;

  // Update account information
  document.getElementById("usernameDisplay").textContent = username;
  document.getElementById("emailDisplay").textContent = email;
  document.getElementById("memberSince").textContent = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "N/A";

  // Update statistics
  document.getElementById("totalOperations").textContent =
    profile.totalOperations || 0;
  document.getElementById("savedResults").textContent =
    profile.savedResults || 0;
  document.getElementById("mostUsed").textContent =
    profile.mostUsedOperation || "N/A";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  showToast("Logged out successfully", "success");
  setTimeout(() => {
    window.location.href = "Index.html";
  }, 1000);
}

function changePassword() {
  showToast("Password change feature coming soon", "error");
}

function exportData() {
  showToast("Data export feature coming soon", "error");
}

function deleteAccount() {
  if (
    confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    )
  ) {
    showToast("Account deletion feature coming soon", "error");
  }
}

function showToast(message, type = "success") {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
