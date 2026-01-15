let currentDomain = "";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = new URL(tabs[0].url);
  currentDomain = url.hostname;
  document.getElementById("site").innerText =
    "Enable ApplyFast on:\n" + currentDomain;
});

document.getElementById("enableBtn").addEventListener("click", () => {
  chrome.storage.local.get({ allowedSites: [] }, (res) => {
    const sites = res.allowedSites;

    if (!sites.includes(currentDomain)) {
      sites.push(currentDomain);
    }

    chrome.storage.local.set({ allowedSites: sites }, () => {
      alert("ApplyFast enabled on this site ✅");
    });
  });
});

document.getElementById("openProfile").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});