"use strict";

// Modern popup controller with smooth animations
const pd = document.getElementById("pd");
const st = document.getElementById("st");
const cb = document.getElementById("cb");

// ── Enable/Disable Toggle ──
const extToggle = document.getElementById("extToggle");
const toggleLabel = document.getElementById("toggleLabel");

let extensionEnabled = true;

function applyToggleUI(enabled) {
  extensionEnabled = enabled;
  if (enabled) {
    extToggle.classList.add("active");
    toggleLabel.textContent = "ON";
    document.body.classList.remove("ext-disabled");
    pd.className = "";
    st.textContent = "Ready to extract & copy";
  } else {
    extToggle.classList.remove("active");
    toggleLabel.textContent = "OFF";
    document.body.classList.add("ext-disabled");
    pd.className = "e";
    st.textContent = "Extension disabled";
  }
}

// Load saved state on popup open
chrome.storage.local.get({ extensionEnabled: true }, (result) => {
  applyToggleUI(result.extensionEnabled);
});

// Toggle click handler
extToggle.addEventListener("click", () => {
  const newState = !extensionEnabled;
  chrome.storage.local.set({ extensionEnabled: newState }, () => {
    applyToggleUI(newState);

    // Notify all Facebook tabs about the state change
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && (tab.url.includes("facebook.com"))) {
          chrome.tabs.sendMessage(tab.id, {
            action: "setEnabled",
            enabled: newState
          }, () => void chrome.runtime.lastError);
        }
      }
    });
  });
});

const SVG_CLIP = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="13" height="17" rx="2.5" fill="none"/><rect x="2" y="5" width="13" height="17" rx="2.5" fill="rgba(255,255,255,0.2)"/></svg>`;

const SVG_CHECK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;

const SVG_X = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`;

const SVG_SPINNER = `<div class="btn-spinner"></div>`;

function setStatus(cls, msg) {
  pd.className = cls;
  st.textContent = msg;

  // Add subtle animation to status text
  st.style.opacity = '0.5';
  setTimeout(() => {
    st.style.opacity = '1';
  }, 150);
}

function safeInsertHTML(parent, htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const nodes = doc.body.childNodes;
  while (nodes.length > 0) {
    parent.appendChild(nodes[0]);
  }
}

function setBtn(state) {
  cb.className = state || '';
  cb.textContent = '';

  if (state === "ok") {
    safeInsertHTML(cb, SVG_CHECK);
    cb.append(' Copied!');
  } else if (state === "fail") {
    safeInsertHTML(cb, SVG_X);
    cb.append(' Failed');
  } else if (state === "processing") {
    safeInsertHTML(cb, SVG_SPINNER);
    cb.append(' Extracting...');
  } else {
    safeInsertHTML(cb, SVG_CLIP);
    cb.append(' Copy Details + Email');
  }
}

function reset() {
  setTimeout(() => {
    setBtn("");
    setStatus("", "Ready to extract & copy");
  }, 1800);
}

// Results display
const results = document.getElementById("results");

function clip(s, n) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function showResults(data) {
  if (!data) return;

  const fields = [
    { id: "r-email", val: data.emails?.length ? data.emails.join(", ") : "" },
    { id: "r-name", val: data.name || "" },
    { id: "r-url", val: data.url || "" },
    { id: "r-bio", val: data.bio || "" },
    { id: "r-insta", val: data.insta || "" },
  ];

  fields.forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val ? clip(val, 36) : "Not found";
    el.className = "res-val " + (val ? "found" : "nil");
    el.title = val || "Not found";
  });

  results.classList.add("visible");
  // Re-trigger animation
  results.style.animation = "none";
  results.offsetHeight;
  results.style.animation = "";
}

// Initialize
setStatus("", "Ready to extract & copy");

async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

cb.addEventListener("click", () => {
  if (!extensionEnabled) return;
  setStatus("w", "Connecting to page...");
  setBtn("processing");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) {
      setStatus("e", "No active tab found");
      setBtn("fail");
      reset();
      return;
    }

    function send() {
      chrome.tabs.sendMessage(tabId, { action: "triggerCopy" }, async (resp) => {
        void chrome.runtime.lastError;
        let ok = resp && resp.success;
        if (ok && resp.data) {
          showResults(resp.data);
          
          const d = resp.data;
          const emailText = d.emails && d.emails.length ? d.emails.join(", ") : "No_Email_Found";
          const detailsText = [
            `Guest FB Page Name: ${d.name || "Unknown"}`,
            `Guest FB Page Link: ${d.url}`,
            `Guest Bio: "${d.bio || ""}"`,
            `Guest IG Link: ${d.insta || ""}`,
            `Guest Email: ${emailText}`
          ].join("\n");
          
          // Write to clipboard from popup context (safe and active document context)
          const ok1 = await writeClipboard(detailsText);
          await new Promise((r) => setTimeout(r, 800));
          const ok2 = await writeClipboard(emailText);
          ok = ok1 || ok2;
        }
        setBtn(ok ? "ok" : "fail");
        setStatus(ok ? "" : "e", ok ? "Clips ready — Ctrl+V (or Win+V)" : "Copy failed");
        reset();
      });
    }

    // Ping to check if content script is alive; inject if not
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (resp) => {
      void chrome.runtime.lastError;
      if (resp && resp.alive) {
        send();
      } else {
        chrome.scripting.executeScript(
          { 
            target: { tabId }, 
            files: ["content-utils.js", "content-extractor.js", "content-ui.js"] 
          },
          () => {
            void chrome.runtime.lastError;
            setTimeout(send, 500);
          },
        );
      }
    });
  });
});

    // Handle Open Dashboard button
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }

// Keyboard shortcut hint
console.log("wajahat_ali_mir Toolkit v3.0.0: Press Ctrl+Q on any Facebook page to extract data");

// Check profile state
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0]?.id;
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { action: "checkProfile" }, (resp) => {
    void chrome.runtime.lastError;
    if (resp && resp.isProfile) {
      document.body.classList.add("profile-mode");
    }
  });
});