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

  if (input.type === "tel" || context.includes("phone") || context.includes("mobile")) {
    return "phone";
  }

  if (
    context.includes("linkedin") ||
    context.includes("github") ||
    context.includes("leetcode") ||
    context.includes("website") ||
    context.includes("url") ||
    context.includes("link")
  ) {
    return "social";
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

/* ================== NAME PARSING (FINAL LOGIC) ================== */
function parseFullName(fullName) {
  if (!fullName) return {};

  const parts = fullName.trim().split(/\s+/);

  return {
    fullName,
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : ""
  };
}

/* ================== NAME SUBTYPE DETECTION ================== */
function detectNameSubtype(input) {
  const context = getFieldContext(input);

  if (context.includes("first")) return "firstName";
  if (context.includes("last")) return "lastName";
  if (context.includes("full")) return "fullName";

  // Generic "Name"
  return "fullName";
}

/* ================== FIELD → PROFILE KEYS ================== */
const FIELD_TYPE_TO_KEYS = {
  email: ["email"],
  phone: ["phone"],
  social: ["linkedin", "github", "leetcode"],
  name: ["firstName", "lastName", "fullName"],
  longText: ["summary", "experience"],
  text: ["college"]
};

/* ================== LABELS ================== */
const KEY_LABELS = {
  firstName: "First Name",
  lastName: "Last Name",
  fullName: "Full Name",
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  github: "GitHub",
  leetcode: "LeetCode",
  college: "College",
  summary: "Summary",
  experience: "Experience"
};

/* ================== SMART KEY FILTERING ================== */
function getAllowedKeysForField(input) {
  const fieldType = detectFieldType(input);

  if (fieldType !== "name") {
    return FIELD_TYPE_TO_KEYS[fieldType] || [];
  }

  // Name-specific filtering
  const subtype = detectNameSubtype(input);

  if (subtype === "firstName") return ["firstName"];
  if (subtype === "lastName") return ["lastName"];
  if (subtype === "fullName") return ["fullName"];

  return ["fullName"];
}

/* ================== FOCUS DETECTION ================== */
document.addEventListener("focusin", (event) => {
  const target = event.target;

  if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;

  activeField = target;
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

/* ================== FLOATING BOX UI ================== */
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

/* ================== AUTOFILL LOGIC ================== */
function autofillField(key) {
  if (!activeField) return;

  chrome.storage.local.get(["profile"], (res) => {
    if (!res.profile) {
      alert("No profile data saved");
      return;
    }

    // Name handling
    if (["firstName", "lastName", "fullName"].includes(key)) {
      const nameData = parseFullName(res.profile.fullName);

      if (!nameData[key]) {
        alert(`No data available for ${KEY_LABELS[key]}`);
        return;
      }

      setNativeValue(activeField, nameData[key]);
    } else {
      // Normal fields
      if (!res.profile[key]) {
        alert(`No data saved for ${KEY_LABELS[key]}`);
        return;
      }

      setNativeValue(activeField, res.profile[key]);
    }

    console.log(`✅ ApplyFast autofilled: ${key}`);

    floatingBox.remove();
    floatingBox = null;
  });
}