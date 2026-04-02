const API_BASE_URL = "http://localhost:5001";
let allHistory = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndLoadHistory();
});

function checkAuthAndLoadHistory() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "Auth.html";
    return;
  }
  loadHistory();
}

async function loadHistory() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      API_BASE_URL + "/api/QuantityMeasurement/history",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "Auth.html";
        return;
      }
      throw new Error("Failed to load history");
    }

    const history = await response.json();
    allHistory = history;
    displayHistory(applyFilter(history, currentFilter));
  } catch (error) {
    console.error("Error loading history:", error);
    document.getElementById("historyTableBody").innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:3rem;color:var(--text-secondary);">
          Failed to load history. Please try again.
        </td>
      </tr>`;
  }
}

function applyFilter(history, filter) {
  if (filter === "all") return history;
  return history.filter(
    (item) => (item.operation || "").toLowerCase() === filter.toLowerCase(),
  );
}

function displayHistory(history) {
  const tbody = document.getElementById("historyTableBody");

  if (!history || history.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:3rem;color:var(--text-secondary);">
          No operations saved yet. Start calculating to build your history!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = history
    .map((item) => {
      const date = new Date(item.timestamp).toLocaleString();
      const operation = item.operation || "Unknown";
      const details = formatDetails(item);
      const result = formatResult(item);

      return `
        <tr>
          <td>${date}</td>
          <td>
            <span class="operation-badge badge-${operation.toLowerCase()}">${operation.toUpperCase()}</span>
          </td>
          <td>${details}</td>
          <td>${result}</td>
          <td>
            <button class="btn-secondary"
              style="padding:0.5rem 1rem;font-size:0.85rem;"
              onclick="deleteHistoryItem('${item.id}')">
              Delete
            </button>
          </td>
        </tr>`;
    })
    .join("");
}

function formatDetails(item) {
  const op = (item.operation || "").toLowerCase();

  if (op === "convert") {
    return `${fmt(item.operand1Value)} ${item.operand1Unit ?? ""} → (${item.resultUnit ?? ""})`;
  }
  if (
    op === "compare" ||
    op === "add" ||
    op === "subtract" ||
    op === "divide"
  ) {
    const sym =
      { add: "+", subtract: "−", divide: "÷", compare: "vs" }[op] || op;
    return `${fmt(item.operand1Value)} ${item.operand1Unit ?? ""} ${sym} ${fmt(item.operand2Value)} ${item.operand2Unit ?? ""}`;
  }
  return "N/A";
}

function formatResult(item) {
  const op = (item.operation || "").toLowerCase();

  if (op === "compare") {
    return item.boolResult === true ? "✓ Equal" : "✗ Not equal";
  }
  if (op === "divide") {
    return item.scalarResult != null ? item.scalarResult.toFixed(6) : "N/A";
  }
  if (item.resultValue != null) {
    return `${fmt(item.resultValue)} ${item.resultUnit ?? ""}`;
  }
  return "N/A";
}

function fmt(n) {
  if (n == null) return "—";
  return parseFloat(n.toPrecision(8)).toString();
}

function filterHistory(filter) {
  currentFilter = filter;
  displayHistory(applyFilter(allHistory, filter));
}

async function deleteHistoryItem(id) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/QuantityMeasurement/history/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Failed to delete item");

    showToast("Item deleted successfully", "success");
    loadHistory();
  } catch (error) {
    console.error("Error deleting item:", error);
    showToast("Failed to delete item", "error");
  }
}

async function clearHistory() {
  if (!confirm("Clear ALL history? This cannot be undone.")) return;

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      API_BASE_URL + "/api/QuantityMeasurement/history/clear",
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) throw new Error("Failed to clear history");

    showToast("History cleared", "success");
    allHistory = [];
    displayHistory([]);
  } catch (error) {
    console.error("Error clearing history:", error);
    showToast("Failed to clear history", "error");
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  showToast("Logged out successfully", "success");
  setTimeout(() => {
    window.location.href = "Index.html";
  }, 1000);
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
