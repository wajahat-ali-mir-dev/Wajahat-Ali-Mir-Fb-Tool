/**
 * Wajahat Ali Mir Fb Tool — User Interface Module
 * Styles, panel elements, user interactions, keyboard shortcuts, and message orchestration.
 */
(function () {
  "use strict";

  if (document.getElementById("wam-root")) return;

  /* ── STATE ── */
  let isExtracting = false;
  let autoScrolling = false;
  let scrollRAF = null;
  let extensionEnabled = true;

  /* ── STYLES ── */
  const css = `
    #wam-root {
      --wam-primary: #1877F2;
      --wam-primaryDark: #0d5cb6;
      --wam-success: #10b981;
      --wam-warning: #f59e0b;
      --wam-error: #ef4444;
      --wam-glass: rgba(13, 14, 22, 0.88);
      --wam-surface: rgba(255, 255, 255, 0.03);
      --wam-border: rgba(255, 255, 255, 0.08);
      --wam-text: #f0f2f5;
      --wam-text-muted: #8b92a8;

      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      background: var(--wam-glass);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--wam-border);
      border-radius: 16px;
      box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.5);
      transform-origin: bottom right;
      transition: opacity 0.2s ease, transform 0.2s ease;
      overflow: hidden;
    }

    #wam-root.wam-hidden {
      opacity: 0;
      transform: scale(0.92) translateY(16px);
      pointer-events: none;
    }

    /* Header */
    #wam-hdr {
      background: linear-gradient(135deg, rgba(24, 119, 242, 0.92), rgba(13, 90, 200, 0.96));
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .wam-hl { display: flex; align-items: center; gap: 10px; }

    .wam-logo {
      width: 32px; height: 32px; border-radius: 8px; overflow: hidden;
      border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0;
    }
    .wam-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .wam-t1 { font-size: 12px; font-weight: 700; color: #fff; }
    .wam-t2 { font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 1px; }

    .wam-hbtns { display: flex; gap: 5px; }

    .wam-hb {
      width: 26px; height: 26px; border: none; cursor: pointer;
      background: rgba(255,255,255,0.12); border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.9); padding: 0;
      transition: background 0.15s ease;
    }
    .wam-hb:hover { background: rgba(255,255,255,0.22); }
    .wam-hb:active { opacity: 0.7; }

    /* Body */
    #wam-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 480px;
      overflow: hidden;
      transition: max-height 0.2s ease, opacity 0.2s ease, padding 0.2s ease;
    }
    #wam-body.wam-collapsed {
      max-height: 0; padding-top: 0; padding-bottom: 0; opacity: 0;
    }

    /* Status */
    #wam-stat {
      display: flex; align-items: center; gap: 8px;
      font-size: 11px; color: var(--wam-text-muted);
      padding: 8px 10px;
      background: var(--wam-surface);
      border-radius: 8px;
      border: 1px solid var(--wam-border);
    }
    #wam-stat.wam-active { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.25); color: var(--wam-success); }
    #wam-stat.wam-warning { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.25); color: var(--wam-warning); }
    #wam-stat.wam-error { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); color: var(--wam-error); }

    #wam-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--wam-success); flex-shrink: 0;
    }
    #wam-dot.w { background: var(--wam-warning); }
    #wam-dot.e { background: var(--wam-error); }

    /* Data Card */
    #wam-card {
      background: var(--wam-surface);
      border: 1px solid var(--wam-border);
      border-radius: 10px;
      padding: 10px;
      display: flex; flex-direction: column; gap: 6px;
    }

    .wam-row {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 11px; line-height: 1.4;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    .wam-row:last-child { border-bottom: none; }

    .wam-ri {
      width: 16px; height: 16px; text-align: center; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.04); border-radius: 4px; font-size: 10px;
    }
    .wam-rk {
      color: var(--wam-text-muted); font-weight: 600; flex-shrink: 0;
      min-width: 38px; text-transform: uppercase; letter-spacing: 0.4px; font-size: 9px;
    }
    .wam-rv {
      color: var(--wam-text-muted); overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; flex: 1; min-width: 0; font-weight: 500;
    }
    .wam-rv.ok { color: var(--wam-text); }
    .wam-rv.nil { color: #4a4f64; font-style: italic; }

    /* Buttons */
    .wam-bgrp { display: flex; gap: 6px; margin-top: 2px; }

    .wam-btn {
      flex: 1; padding: 11px 12px; border: none; border-radius: 10px;
      cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600;
      color: #fff; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.15s ease;
      background: linear-gradient(135deg, var(--wam-primary), var(--wam-primaryDark));
      box-shadow: 0 3px 12px rgba(24,119,242,0.3);
    }
    .wam-btn:hover { opacity: 0.9; }
    .wam-btn:active { opacity: 0.7; }
    .wam-btn.ok { background: linear-gradient(135deg, #059669, #047857) !important; box-shadow: 0 3px 12px rgba(5,150,105,0.3) !important; }
    .wam-btn.fail { background: linear-gradient(135deg, #dc2626, #b91c1c) !important; box-shadow: 0 3px 12px rgba(220,38,38,0.3) !important; }
    .wam-btn.processing { pointer-events: none; opacity: 0.7; }

    .wam-btn-scroll {
      width: 42px; flex: none; padding: 11px 0;
      border: none; border-radius: 10px; cursor: pointer;
      font-family: inherit; font-size: 12px; font-weight: 600; color: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s ease;
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    }
    .wam-btn-scroll:hover { opacity: 0.85; }
    .wam-btn-scroll:active { opacity: 0.6; }
    .wam-btn-scroll.active {
      background: linear-gradient(135deg, #f59e0b, #d97706) !important;
      border-color: transparent;
      box-shadow: 0 3px 12px rgba(245,158,11,0.3);
    }

    .wam-btn-spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: wam-spin 0.7s linear infinite;
    }
    @keyframes wam-spin { to { transform: rotate(360deg); } }

    /* Footer */
    #wam-foot {
      border-top: 1px solid var(--wam-border);
      padding: 10px 14px;
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(0,0,0,0.15);
    }
    .wam-by { font-size: 10px; color: #4a4f64; font-weight: 600; display: flex; align-items: center; gap: 5px; }
    .wam-by b { color: #6b7280; font-weight: 700; }
    .wam-by a { color: inherit; text-decoration: none; }
    .wam-kb { display: flex; gap: 3px; align-items: center; }
    .wam-k {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px; padding: 2px 6px; font-size: 9px; color: #6b7280; font-weight: 600;
    }

    @media (max-width: 400px) {
      #wam-root { width: calc(100vw - 32px); right: 8px; bottom: 8px; }
    }

    /* Profile Mode (Red) */
    #wam-root.wam-profile-mode {
      --wam-primary: #ef4444;
      --wam-primaryDark: #b91c1c;
    }
    #wam-root.wam-profile-mode #wam-hdr {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.92), rgba(185, 28, 28, 0.96));
    }
    #wam-root.wam-profile-mode .wam-btn {
      box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
    }
  `;

  const styleEl = document.createElement("style");
  styleEl.id = "wam-styles-v2";
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  /* ── SVG ICONS ── */
  const I = {
    collapse: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>`,
    expand: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`,
    close: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
    fail: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    clip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
    email: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    user: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    link: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    bio: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    insta: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    scroll: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>`,
    stop: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`,
  };

  /* ── BUILD UI ── */
  let iconSrc = "";
  try {
    iconSrc = chrome.runtime.getURL("icons/icon48.png");
  } catch (_) {}

  const logoHtml = iconSrc
    ? `<div class="wam-logo"><img src="${iconSrc}" alt="WAM"/></div>`
    : `<div class="wam-logo" style="background:linear-gradient(135deg,#1877F2,#0550c0);display:flex;align-items:center;justify-content:center;"><span style="color:#fff;font-size:14px;font-weight:700">M</span></div>`;

  const panel = document.createElement("div");
  panel.id = "wam-root";
  panel.innerHTML = `
    <div id="wam-hdr">
      <div class="wam-hl">
        ${logoHtml}
        <div>
          <div class="wam-t1">wajahat ali mir Fb Tool</div>
          <div class="wam-t2">v3.0 · Fast Modules</div>
        </div>
      </div>
      <div class="wam-hbtns">
        <button class="wam-hb" id="wam-col-btn" title="Collapse">${I.collapse}</button>
        <button class="wam-hb" id="wam-cls-btn" title="Hide">${I.close}</button>
      </div>
    </div>

    <div id="wam-body">
      <div id="wam-stat">
        <div id="wam-dot"></div>
        <span id="wam-stxt">Ready — Ctrl+Q or click button</span>
      </div>

      <div id="wam-card">
        <div class="wam-row"><span class="wam-ri">${I.email}</span><span class="wam-rk">Email</span><span class="wam-rv nil" id="wp-email">—</span></div>
        <div class="wam-row"><span class="wam-ri">${I.user}</span><span class="wam-rk">Name</span><span class="wam-rv nil" id="wp-name">—</span></div>
        <div class="wam-row"><span class="wam-ri">${I.link}</span><span class="wam-rk">URL</span><span class="wam-rv nil" id="wp-url">—</span></div>
        <div class="wam-row"><span class="wam-ri">${I.bio}</span><span class="wam-rk">Bio</span><span class="wam-rv nil" id="wp-bio">—</span></div>
        <div class="wam-row"><span class="wam-ri">${I.insta}</span><span class="wam-rk">Insta</span><span class="wam-rv nil" id="wp-insta">—</span></div>
      </div>

      <div class="wam-bgrp">
        <button class="wam-btn" id="wam-cb">${I.clip} Copy Details + Email</button>
        <button class="wam-btn-scroll" id="wam-scroll-btn" title="Auto Scroll">${I.scroll}</button>
      </div>
    </div>

    <div id="wam-foot">
      <span class="wam-by">✦ <a href="https://github.com/wajahat-ali-mir-dev" target="_blank"><b>Wajahat Ali Mir</b></a></span>
      <div class="wam-kb">
        <span class="wam-k">Ctrl</span><span class="wam-k">Q</span>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  /* ── ELEMENT REFS ── */
  const body = panel.querySelector("#wam-body");
  const dot = panel.querySelector("#wam-dot");
  const stxt = panel.querySelector("#wam-stxt");
  const stat = panel.querySelector("#wam-stat");
  const btnC = panel.querySelector("#wam-cb");
  const colBtn = panel.querySelector("#wam-col-btn");
  const clsBtn = panel.querySelector("#wam-cls-btn");
  const scrollBtn = panel.querySelector("#wam-scroll-btn");

  const wpEmail = panel.querySelector("#wp-email");
  const wpName = panel.querySelector("#wp-name");
  const wpUrl = panel.querySelector("#wp-url");
  const wpBio = panel.querySelector("#wp-bio");
  const wpInsta = panel.querySelector("#wp-insta");

  /* ── COLLAPSE / CLOSE ── */
  let collapsed = false;
  colBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    collapsed = !collapsed;
    body.classList.toggle("wam-collapsed", collapsed);
    colBtn.innerHTML = collapsed ? I.expand : I.collapse;
    colBtn.title = collapsed ? "Expand" : "Collapse";
  });

  clsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.add("wam-hidden");
  });

  /* ── AUTO-SCROLL ── */
  function startAutoScroll() {
    autoScrolling = true;
    scrollBtn.classList.add("active");
    scrollBtn.innerHTML = I.stop;
    scrollBtn.title = "Stop Scroll";

    function step() {
      if (!autoScrolling) return;
      window.scrollBy(0, 150);
      scrollRAF = requestAnimationFrame(step);
    }
    scrollRAF = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    autoScrolling = false;
    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    scrollRAF = null;
    scrollBtn.classList.remove("active");
    scrollBtn.innerHTML = I.scroll;
    scrollBtn.title = "Auto Scroll";
  }

  scrollBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (autoScrolling) {
      stopAutoScroll();
    } else {
      startAutoScroll();
    }
  });

  /* ── PREVIEW UI UPDATE ── */
  function clipText(s, n) {
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  function setPreview(d) {
    const eStr = d.emails.length ? d.emails.join(", ") : "";
    wpEmail.textContent = eStr ? clipText(eStr, 28) : "Not found";
    wpEmail.className = "wam-rv " + (eStr ? "ok" : "nil");
    wpName.textContent = d.name ? clipText(d.name, 28) : "—";
    wpName.className = "wam-rv " + (d.name ? "ok" : "nil");
    wpUrl.textContent = clipText(d.url, 28);
    wpUrl.className = "wam-rv ok";
    wpBio.textContent = d.bio ? clipText(d.bio, 28) : "Not found";
    wpBio.className = "wam-rv " + (d.bio ? "ok" : "nil");
    wpInsta.textContent = d.insta ? clipText(d.insta, 28) : "Not found";
    wpInsta.className = "wam-rv " + (d.insta ? "ok" : "nil");
  }

  function setStatus(cls, msg, type = "") {
    dot.className = cls;
    stxt.textContent = msg;
    stat.className = type;
  }

  function setBtn(btn, state, icon, label) {
    btn.className = "wam-btn" + (state ? " " + state : "");
    if (state === "ok") {
      btn.innerHTML = `${I.check} Copied!`;
    } else if (state === "fail") {
      btn.innerHTML = `${I.fail} Failed`;
    } else if (state === "processing") {
      btn.innerHTML = `<div class="wam-btn-spinner"></div> Extracting...`;
    } else {
      btn.innerHTML = `${icon} ${label}`;
    }
  }

  /* ── COPY TRIGGER Orchestration ── */
  async function copyBothClips() {
    if (isExtracting) return;
    if (!extensionEnabled) return;
    isExtracting = true;

    setStatus("w", "Analyzing page...", "wam-warning");
    setBtn(btnC, "processing", I.clip, "Copy Details + Email");

    if (window.wam.revealHiddenInfo) {
      await window.wam.revealHiddenInfo();
    }
    await new Promise((r) => setTimeout(r, 30));

    const d = window.wam.extractAll ? window.wam.extractAll() : {};
    setPreview(d);

    // Save page details to background (best effort)
    try {
      chrome.runtime.sendMessage(
        { action: "savePageDetails", details: d },
        (response) => {
          void chrome.runtime.lastError;
        },
      );
    } catch (_) {}

    const emailText = d.emails && d.emails.length ? d.emails.join(", ") : "No_Email_Found";
    
    // We add the Guest Email field here in the details block to ensure it gets copied reliably
    const detailsText = [
      `Guest FB Page Name: ${d.name || "Unknown"}`,
      `Guest FB Page Link: ${d.url}`,
      `Guest Bio: "${d.bio || ""}"`,
      `Guest IG Link: ${d.insta || ""}`,
      `Guest Email: ${emailText}`
    ].join("\n");

    let ok1 = false;
    let ok2 = false;

    if (window.wam.writeClipboard) {
      ok1 = await window.wam.writeClipboard(detailsText);
      await new Promise((r) => setTimeout(r, 800));
      ok2 = await window.wam.writeClipboard(emailText);
    }

    // Success if at least the details block (which now includes email) was written
    const ok = ok1 || ok2;

    if (ok) {
      setStatus("", "Clips ready — Ctrl+V (or Win+V)", "wam-active");
      setBtn(btnC, "ok", I.clip, "Copy Details + Email");
    } else {
      setStatus("e", "Copy failed — try again", "wam-error");
      setBtn(btnC, "fail", I.clip, "Copy Details + Email");
    }

    setTimeout(() => {
      setBtn(btnC, "", I.clip, "Copy Details + Email");
      setStatus("", "Ready — Ctrl+Q or click button", "");
      isExtracting = false;
    }, 1500);

    return { ok, data: d };
  }

  btnC.addEventListener("click", copyBothClips);

  /* ── MESSAGE LISTENER ── */
  try {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.action === "setEnabled") {
        extensionEnabled = !!msg.enabled;
        if (extensionEnabled) {
          panel.classList.remove("wam-hidden");
          setStatus("", "Ready — Ctrl+Q or click button", "");
        } else {
          panel.classList.add("wam-hidden");
          if (autoScrolling) stopAutoScroll();
        }
        sendResponse({ success: true });
        return;
      }
      if (msg.action === "triggerCopy") {
        if (!extensionEnabled) {
          sendResponse({ success: false, error: "Extension disabled" });
          return;
        }
        if (typeof collapsed !== "undefined" && collapsed) {
          collapsed = false;
          body.classList.remove("wam-collapsed");
          colBtn.innerHTML = I.collapse;
          colBtn.title = "Collapse";
        }
        panel.classList.remove("wam-hidden");

        copyBothClips().then((result) =>
          sendResponse({
            success: !!result.ok,
            data: result.data,
          }),
        );
        return true;
      }
      if (msg.action === "ping") {
        sendResponse({
          alive: true,
          isProfile: window.wam.isProfile ? window.wam.isProfile() : false,
        });
      }
      if (msg.action === "checkProfile") {
        sendResponse({
          isProfile: window.wam.isProfile ? window.wam.isProfile() : false,
        });
      }
    });
  } catch (_) {}

  /* ── KEYBOARD SHORTCUT (Ctrl+Q) ── */
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === "q") {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      
      if (!isInput && extensionEnabled) {
        e.preventDefault();
        e.stopPropagation();
        
        if (collapsed) {
          collapsed = false;
          body.classList.remove("wam-collapsed");
          colBtn.innerHTML = I.collapse;
          colBtn.title = "Collapse";
        }
        panel.classList.remove("wam-hidden");
        
        copyBothClips();
      }
    }
  });

  // Regular updates
  setInterval(() => {
    if (window.wam.checkProfileState) window.wam.checkProfileState();
    if (window.wam.processReels) window.wam.processReels();
  }, 2500);

  // Initial state check
  try {
    chrome.storage.local.get({ extensionEnabled: true }, (result) => {
      if (chrome.runtime.lastError) return;
      extensionEnabled = !!result.extensionEnabled;
      if (!extensionEnabled) {
        panel.classList.add("wam-hidden");
      }
    });
  } catch (_) {}
})();
