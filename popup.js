"use strict";

// Modern popup controller with smooth animations
const pd = document.getElementById("pd");
const st = document.getElementById("st");
const cb = document.getElementById("cb");

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

cb.addEventListener("click", () => {
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
      chrome.tabs.sendMessage(tabId, { action: "triggerCopy" }, (resp) => {
        void chrome.runtime.lastError;
        const ok = resp && resp.success;
        setBtn(ok ? "ok" : "fail");
        setStatus(ok ? "" : "e", ok ? "Both clips copied!" : "Copy failed");
        if (ok && resp.data) {
          showResults(resp.data);
        }
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
          { target: { tabId }, files: ["content.js"] },
          () => {
            void chrome.runtime.lastError;
            setTimeout(send, 500);
          },
        );
      }
    });
  });
});

    // Handle Export CSV button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        setStatus('w', 'Exporting CSV...');
        chrome.runtime.sendMessage({ action: 'exportCSV' }, (response) => {
          setStatus('', response?.success ? 'Exported' : 'Export failed');
        });
      });
    }

    // Handle Clear Data button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        setStatus('w', 'Clearing data...');
        chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
          setStatus('', response?.success ? 'Data cleared' : 'Clear failed');
        });
      });
    }

// Keyboard shortcut hint
console.log("wajahat ali mir Fb Tool v3.0.0: Press Ctrl+Q on any Facebook page to extract data");

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