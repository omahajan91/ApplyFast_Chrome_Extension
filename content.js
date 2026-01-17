console.log("✅ ApplyFast content.js loaded");

/* ================== STATE ================== */
let activeField = null;
let floatingBox = null;

/* ================== FIELD CONTEXT ================== */
function getFieldContext(input) {
  return `
    ${input.type || ""}
    ${input.name || ""}
    ${input.id || ""}
    ${input.placeholder || ""}
    ${input.getAttribute("aria-label") || ""}
  `.toLowerCase();
}

/* ================== FIELD TYPE DETECTION ================== */
function detectFieldType(input) {
  const context = getFieldContext(input);

  if (input.type === "email" || context.includes("email")) {
    return "email";
  }

  if (context.includes("name")) {
    return "name";
  }

  if (
    input.tagName === "TEXTAREA" ||
    context.includes("summary") ||
    context.includes("experience") ||
    context.includes("about")
  ) {
    return "longText";
  }

  return "text";
}

/* ================== FIELD → PROFILE KEYS ================== */
const FIELD_TYPE_TO_KEYS = {
  email: ["email"],
  name: ["fullName"],        // name intelligence comes later
  longText: ["summary", "experience"],
  text: ["college"]
};

/* ================== LABELS ================== */
const KEY_LABELS = {
  fullName: "Full Name",
  email: "Email",
  college: "College",
  summary: "Summary",
  experience: "Experience"
};

/* ================== GET ALLOWED KEYS ================== */
function getAllowedKeysForField(input) {
  const fieldType = detectFieldType(input);
  return FIELD_TYPE_TO_KEYS[fieldType] || [];
}

/* ================== FOCUS DETECTION ================== */
document.addEventListener("focusin", (event) => {
  const target = event.target;

  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  activeField = target;

  console.log("🎯 Focused field type:", detectFieldType(target));
  showFloatingBox(target);
});

/* ================== CLICK OUTSIDE ================== */
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

/* ================== REACT-SAFE VALUE SETTER ================== */
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    element.__proto__,
    "value"
  ).set;

  valueSetter.call(element, value);

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

/* ================== FLOATING BOX ================== */
function showFloatingBox(field) {
  if (floatingBox) {
    floatingBox.remove();
    floatingBox = null;
  }

  const allowedKeys = getAllowedKeysForField(field);

  if (!allowedKeys.length) return;

  floatingBox = document.createElement("div");

  floatingBox.innerHTML = `
    <div style="font-weight:600;margin-bottom:4px">ApplyFast</div>
    ${allowedKeys
      .map(
        (key) =>
          `<button data-key="${key}">${KEY_LABELS[key]}</button>`
      )
      .join("")}
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
    minWidth: "140px"
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

/* ================== AUTOFILL ================== */
function autofillField(key) {
  if (!activeField) return;

  chrome.storage.local.get(["profile"], (res) => {
    if (!res.profile || !res.profile[key]) {
      alert(`No data saved for ${KEY_LABELS[key]}`);
      return;
    }

    setNativeValue(activeField, res.profile[key]);
    console.log(`✅ ApplyFast autofilled: ${key}`);

    floatingBox.remove();
    floatingBox = null;
  });
}