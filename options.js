const fields = [
  "summary",
  "skills",
  "experience"
];

const status = document.getElementById("status");

/* ---------------- LOAD PROFILE ---------------- */
chrome.storage.local.get(["profile"], (result) => {
  if (result.profile) {
    fields.forEach((field) => {
      const el = document.getElementById(field);
      if (el) el.value = result.profile[field] || "";
    });
  }
});

/* ---------------- SAVE PROFILE ---------------- */
document.getElementById("saveProfile").addEventListener("click", () => {
  const profile = {};

  fields.forEach((field) => {
    const el = document.getElementById(field);
    if (el) profile[field] = el.value.trim();
  });

  chrome.storage.local.set({ profile }, () => {
    status.innerText = "Profile saved successfully ✅";
    setTimeout(() => (status.innerText = ""), 2000);
  });
});