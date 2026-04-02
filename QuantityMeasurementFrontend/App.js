const API_BASE_URL = "http://localhost:5001";
const PENDING_KEY = "pendingOperations";

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  handleGoogleCallbackToken();
});

// ── Auth ─────────────────────────────────────────────────────────────────────

function checkAuth() {
  const loggedIn = !!localStorage.getItem("token");
  const authBtn = document.getElementById("authBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const historyBtn = document.getElementById("historyBtn");
  const profileBtn = document.getElementById("profileBtn");
  authBtn && (authBtn.style.display = loggedIn ? "none" : "block");
  logoutBtn && (logoutBtn.style.display = loggedIn ? "block" : "none");
  historyBtn && (historyBtn.style.display = loggedIn ? "block" : "none");
  profileBtn && (profileBtn.style.display = loggedIn ? "block" : "none");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  checkAuth();
  showToast("Logged out", "success");
  setTimeout(() => (window.location.href = "Index.html"), 800);
}

// Called when Google OAuth redirects back with ?token=...&username=...
function handleGoogleCallbackToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const username = params.get("username");
  if (!token) return;

  localStorage.setItem("token", token);
  if (username) localStorage.setItem("username", decodeURIComponent(username));
  window.history.replaceState({}, "", window.location.pathname);
  checkAuth();
  // Flush any operations that were queued before this login
  flushPendingOperations().then(() => {
    showToast(`Welcome, ${localStorage.getItem("username") || ""}!`, "success");
  });
}

// Cross-tab: auth.html saves token → this tab picks it up
window.addEventListener("storage", (e) => {
  if (e.key === "token" && e.newValue) {
    checkAuth();
    flushPendingOperations();
  }
});

// ── Pending queue ─────────────────────────────────────────────────────────────

function getPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
}
function addToPending(p) {
  const l = getPending();
  l.push(p);
  localStorage.setItem(PENDING_KEY, JSON.stringify(l));
}
function clearPending() {
  localStorage.removeItem(PENDING_KEY);
}

async function flushPendingOperations() {
  const pending = getPending();
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
      clearPending();
      showToast(
        `${pending.length} queued operation(s) saved to your account!`,
        "success",
      );
    } else {
      const err = await res.json().catch(() => ({}));
      console.error("Flush batch failed:", err);
    }
  } catch (e) {
    console.error("Flush error:", e);
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

let currentOperation = null;
let currentResult = null;
let currentRequest = null;

function selectOperation(op) {
  currentOperation = op;
  const titles = {
    add: "Add Quantities",
    subtract: "Subtract Quantities",
    divide: "Divide Quantity",
    compare: "Compare Quantities",
    convert: "Convert Units",
  };
  document.getElementById("modalTitle").textContent = titles[op] || op;
  document.getElementById("modalBody").innerHTML = getOperationForm(op);
  document.getElementById("operationModal").classList.add("active");
}

function closeModal() {
  document.getElementById("operationModal").classList.remove("active");
}

function getOperationForm(op) {
  const cats = ["Length", "Weight", "Volume", "Temperature"];
  const catSel = `<div class="form-group"><label>Unit Category</label><select id="categorySelect" onchange="updateUnitOptions()"><option value="">Select category</option>${cats.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>`;

  if (op === "convert")
    return `${catSel}
    <div class="form-group"><label>Value</label><input type="number" id="value" step="any" placeholder="Enter value" required></div>
    <div class="form-group"><label>From Unit</label><select id="fromUnit"><option value="">Select unit</option></select></div>
    <div class="form-group"><label>To Unit</label><select id="toUnit"><option value="">Select unit</option></select></div>
    <button class="btn-calculate" onclick="performOperation()">Convert</button>`;

  const label =
    { compare: "Compare", add: "Add", subtract: "Subtract", divide: "Divide" }[
      op
    ] || op;
  return `${catSel}
    <div class="form-row">
      <div class="form-group"><label>First Value</label><input type="number" id="value1" step="any" placeholder="0" required></div>
      <div class="form-group"><label>First Unit</label><select id="unit1"><option value="">Select unit</option></select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Second Value</label><input type="number" id="value2" step="any" placeholder="0" required></div>
      <div class="form-group"><label>Second Unit</label><select id="unit2"><option value="">Select unit</option></select></div>
    </div>
    <button class="btn-calculate" onclick="performOperation()">${label}</button>`;
}

function updateUnitOptions() {
  const cat = document.getElementById("categorySelect").value;
  const map = {
    Length: ["Feet", "Inches", "Yards", "Centimeters"],
    Weight: ["Kilogram", "Gram", "Pound"],
    Volume: ["Litre", "Millilitre", "Gallon"],
    Temperature: ["Celsius", "Fahrenheit", "Kelvin"],
  };
  const html =
    '<option value="">Select unit</option>' +
    (map[cat] || []).map((u) => `<option value="${u}">${u}</option>`).join("");
  if (currentOperation === "convert") {
    document.getElementById("fromUnit").innerHTML = html;
    document.getElementById("toUnit").innerHTML = html;
  } else {
    document.getElementById("unit1").innerHTML = html;
    const u2 = document.getElementById("unit2");
    if (u2) u2.innerHTML = html;
  }
}

// ── Perform ───────────────────────────────────────────────────────────────────

async function performOperation() {
  try {
    const cat = document.getElementById("categorySelect")?.value;
    if (!cat) {
      showToast("Please select a category", "error");
      return;
    }

    let endpoint = "",
      body = {};

    if (currentOperation === "convert") {
      const val = parseFloat(document.getElementById("value").value);
      const from = document.getElementById("fromUnit").value;
      const to = document.getElementById("toUnit").value;
      if (!from || !to || isNaN(val)) {
        showToast("Please fill all fields", "error");
        return;
      }
      endpoint = "/api/QuantityMeasurement/convert";
      body = { value: val, fromUnit: from, toUnit: to, category: cat };
    } else {
      const v1 = parseFloat(document.getElementById("value1").value);
      const u1 = document.getElementById("unit1").value;
      const v2 = parseFloat(document.getElementById("value2").value);
      const u2 = document.getElementById("unit2").value;
      if (!u1 || !u2 || isNaN(v1) || isNaN(v2)) {
        showToast("Please fill all fields", "error");
        return;
      }
      endpoint = `/api/QuantityMeasurement/${currentOperation}`;
      body = {
        quantity1: { value: v1, unit: u1, category: cat },
        quantity2: { value: v2, unit: u2, category: cat },
      };
    }

    const res = await fetch(API_BASE_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || "Operation failed");
    }

    const result = await res.json();
    currentResult = result;
    currentRequest = body;

    closeModal();
    displayResult(result);

    // ── Save or queue ──────────────────────────────────────────────────────
    const payload = buildSavePayload(currentOperation, body, result);
    const token = localStorage.getItem("token");

    if (token) {
      await saveToServer(payload, token); // logged in → save immediately
    } else {
      addToPending(payload); // not logged in → queue locally
    }
  } catch (err) {
    console.error("Operation error:", err);
    showToast(err.message || "Failed to perform operation", "error");
  }
}

// ── Build save payload ────────────────────────────────────────────────────────

function buildSavePayload(op, reqBody, apiResult) {
  const data =
    op === "convert"
      ? {
          value: reqBody.value,
          fromUnit: reqBody.fromUnit,
          toUnit: reqBody.toUnit,
          category: reqBody.category,
        }
      : { quantity1: reqBody.quantity1, quantity2: reqBody.quantity2 };

  return {
    operation: op.charAt(0).toUpperCase() + op.slice(1),
    data,
    result: {
      success: apiResult.success,
      operation: apiResult.operation,
      operand1: apiResult.operand1 ?? null,
      operand2: apiResult.operand2 ?? null,
      result: apiResult.result ?? null,
      boolResult: apiResult.boolResult ?? null,
      scalarResult: apiResult.scalarResult ?? null,
    },
  };
}

async function saveToServer(payload, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/QuantityMeasurement/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        checkAuth();
        addToPending(payload);
        return;
      }
      const err = await res.json().catch(() => ({}));
      console.error("Save failed:", err.message);
    }
  } catch (e) {
    console.error("Save error:", e);
    addToPending(payload);
  }
}

// ── Display result ────────────────────────────────────────────────────────────

function displayResult(result) {
  const isLoggedIn = !!localStorage.getItem("token");
  let html = "";

  if (currentOperation === "convert") {
    html = `
      <div class="result-item"><div class="result-label">Converted Value</div>
        <div class="result-value">${fmt(result.result?.value)} ${result.result?.unit ?? ""}</div></div>
      <div class="result-item"><div class="result-label">Original</div>
        <div class="result-value">${fmt(result.operand1?.value)} ${result.operand1?.unit ?? ""}</div></div>`;
  } else if (currentOperation === "compare") {
    const eq = result.boolResult;
    html = `
      <div class="result-item"><div class="result-label">First Quantity</div>
        <div class="result-value">${fmt(result.operand1?.value)} ${result.operand1?.unit ?? ""}</div></div>
      <div class="result-item"><div class="result-label">Second Quantity</div>
        <div class="result-value">${fmt(result.operand2?.value)} ${result.operand2?.unit ?? ""}</div></div>
      <div class="result-item"><div class="result-label">Result</div>
        <div class="result-value" style="color:${eq ? "var(--success)" : "var(--error)"};">${eq ? "✓ Equal" : "✗ Not equal"}</div></div>`;
  } else if (currentOperation === "add" || currentOperation === "subtract") {
    html = `<div class="result-item"><div class="result-label">Result</div>
      <div class="result-value">${fmt(result.result?.value)} ${result.result?.unit ?? ""}</div></div>`;
  } else if (currentOperation === "divide") {
    html = `<div class="result-item"><div class="result-label">Ratio (A ÷ B)</div>
      <div class="result-value">${result.scalarResult?.toFixed(6) ?? "—"}</div></div>`;
  }

  document.getElementById("resultBody").innerHTML = html;

  const saveBtn = document.getElementById("saveBtn");
  const autoSavedNote = document.getElementById("autoSavedNote");

  if (isLoggedIn) {
    // Logged in: auto-saved, show note
    saveBtn && (saveBtn.style.display = "none");
    autoSavedNote && (autoSavedNote.style.display = "block");
  } else {
    // Not logged in: show "Sign in to Save" button
    saveBtn && (saveBtn.style.display = "flex");
    autoSavedNote && (autoSavedNote.style.display = "none");
  }

  document.getElementById("resultDisplay").style.display = "block";
}

function fmt(n) {
  if (n == null) return "—";
  return parseFloat(n.toPrecision(8)).toString();
}

function closeResult() {
  document.getElementById("resultDisplay").style.display = "none";
  currentResult = null;
  currentRequest = null;
}

// "Sign in to Save" button — redirects to auth, pending ops are already queued
function promptSignIn() {
  showToast("Redirecting to sign in — your result is queued!", "success");
  setTimeout(() => (window.location.href = "Auth.html"), 1200);
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg, type = "success") {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

document.addEventListener("click", (e) => {
  if (e.target === document.getElementById("operationModal")) closeModal();
});
