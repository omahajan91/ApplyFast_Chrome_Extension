console.log("✅ ApplyFast content.js loaded");

let activeField = null;
let floatingBox = null;

/* ---------------- FOCUS DETECTION ---------------- */
document.addEventListener("focusin", (event) => {
  const target = event.target;

  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  activeField = target;
  showFloatingBox(target);
});

/* ---------------- CLICK OUTSIDE ---------------- */
document.addEventListener("click", (event) => {
  if (!floatingBox) return;

  if (
    floatingBox.contains(event.target) ||
    event.target === activeField
  ) {
    return;
  }

  floatingBox.remove();
  floatingBox = null;
});

/* ---------------- REACT-SAFE VALUE SETTER ---------------- */
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    element.__proto__,
    "value"
  ).set;

  valueSetter.call(element, value);

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/* ---------------- FLOATING BOX ---------------- */
function showFloatingBox(field) {
  if (floatingBox) {
    floatingBox.remove();
    floatingBox = null;
  }

  floatingBox = document.createElement("div");
  floatingBox.className = "applyfast-box";

  floatingBox.innerHTML = `
    <div style="font-weight:600;margin-bottom:4px">ApplyFast</div>
    <button data-key="summary">Summary</button>
    <button data-key="skills">Skills</button>
    <button data-key="experience">Experience</button>
  `;

  Object.assign(floatingBox.style, {
    position: "fixed",
    background: "#111827",
    color: "#ffffff",
    padding: "8px",
    borderRadius: "8px",
    fontSize: "12px",
    zIndex: "2147483647",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "130px"
  });

  floatingBox.querySelectorAll("button").forEach((btn) => {
    Object.assign(btn.style, {
      background: "#2563eb",
      color: "#ffffff",
      border: "none",
      borderRadius: "4px",
      padding: "5px",
      cursor: "pointer",
      fontSize: "12px"
    });

    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      autofillField(key);
    });
  });

  document.body.appendChild(floatingBox);

  const rect = field.getBoundingClientRect();
  floatingBox.style.top = rect.bottom + 8 + "px";
  floatingBox.style.left = rect.left + "px";
}

/* ---------------- AUTOFILL LOGIC ---------------- */
function autofillField(key) {
  if (!activeField) return;

  chrome.storage.local.get(["profile"], (res) => {
    if (!res.profile || !res.profile[key]) {
      alert(`No data saved for ${key}`);
      return;
    }

    setNativeValue(activeField, res.profile[key]);
    console.log(`✅ ApplyFast autofilled: ${key}`);

    floatingBox.remove();
    floatingBox = null;
  });
}