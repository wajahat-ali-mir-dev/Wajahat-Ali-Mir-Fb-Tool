/**
 * wajahat ali mir Fb Tool v2.1 — Optimized
 * Lightweight UI, fast extraction, auto-scroll
 */
(function () {
  "use strict";

  if (document.getElementById("wam-root")) return;

  /* ── STATE ── */
  let extractionCache = null;
  let isExtracting = false;
  let autoScrolling = false;
  let scrollRAF = null;

  /* ── STYLES — Lean & fast ── */
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
          <div class="wam-t2">v2.1 · Fast</div>
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

    let lastTime = 0;
    function step(ts) {
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

  /* ── DATA EXTRACTION — Fixed ── */

  // Junk titles that Facebook SPA sets on non-profile views
  const JUNK_TITLES = new Set([
    "notifications",
    "messages",
    "watch",
    "marketplace",
    "groups",
    "gaming",
    "facebook",
    "home",
    "friends",
    "events",
    "pages",
    "saved",
    "memories",
    "settings",
    "help",
    "privacy",
    "log in",
    "sign up",
    "create",
    "menu",
    "search",
  ]);

  function isJunkTitle(t) {
    if (!t) return true;
    const lc = t.toLowerCase().trim();
    if (JUNK_TITLES.has(lc)) return true;
    // Reject very short or generic titles
    if (lc.length < 2) return true;
    return false;
  }

  function getPageName() {
    try {
      // 1. Try extracting from URL slug (most reliable on Facebook SPA)
      const path = window.location.pathname;
      // Match /username or /pagename (not system paths)
      const systemPaths = new Set([
        "notifications",
        "messages",
        "watch",
        "marketplace",
        "groups",
        "gaming",
        "events",
        "pages",
        "saved",
        "memories",
        "settings",
        "help",
        "privacy",
        "login",
        "recover",
        "search",
        "friends",
        "bookmarks",
        "profile.php",
        "photo.php",
        "video",
      ]);
      const slugMatch = path.match(/^\/([A-Za-z0-9._-]+)\/?/);
      if (
        slugMatch &&
        slugMatch[1] &&
        !systemPaths.has(slugMatch[1].toLowerCase())
      ) {
        const slug = slugMatch[1];
        // Don't return numeric IDs as names — try to find the display name instead
        if (!/^\d+$/.test(slug)) {
          // Try to find display name from h1 inside main content first
          const mainH1 = document.querySelector(
            '[role="main"] h1, [data-pagelet="ProfileActions"] h1',
          );
          if (mainH1) {
            const h1Text = mainH1.innerText?.trim();
            if (h1Text && !isJunkTitle(h1Text) && h1Text.length < 140) {
              return h1Text;
            }
          }
          // Try the profile cover name area
          const profileName = document.querySelector(
            "h1[class] span a, h1 span",
          );
          if (profileName) {
            const pn = profileName.innerText?.trim();
            if (pn && !isJunkTitle(pn) && pn.length > 1 && pn.length < 140) {
              return pn;
            }
          }
          // Return the slug as display name
          return slug;
        }
      }

      // 2. Try h1 elements inside main content area only (avoid nav/sidebar h1s)
      const mainContent = document.querySelector('[role="main"]');
      if (mainContent) {
        for (const h of mainContent.querySelectorAll("h1")) {
          const t = h.innerText?.trim();
          if (t && t.length > 1 && t.length < 140 && !isJunkTitle(t)) {
            return t;
          }
        }
      }

      // 3. Try og:title but ONLY if not junk
      const og = document.querySelector('meta[property="og:title"]');
      if (og?.content?.trim() && !isJunkTitle(og.content.trim())) {
        return og.content.trim();
      }

      // 4. Fallback: clean document.title
      const cleaned = document.title
        .replace(/\s*[|\-–—]\s*(Facebook|Instagram|LinkedIn).*$/i, "")
        .replace(/^\(\d+\)\s*/, "") // Remove notification count like "(3) "
        .trim();
      if (cleaned && !isJunkTitle(cleaned)) return cleaned;

      return "Unknown";
    } catch (_) {
      return "Unknown";
    }
  }

  function getBio(pageName) {
    try {
      const nameLC = (pageName || "").toLowerCase().trim();

      const introSelectors = [
        '[data-pagelet="ProfileTilesFeed_0"] span',
        '[data-pagelet="above_fold_sidebar"] span',
        'div[class] > div > div > div > span[dir="auto"]',
      ];

      const junk = [
        "intro",
        "see all",
        "add bio",
        "edit bio",
        "details",
        "overview",
        "add a",
        "edit details",
        "see more",
        "hide",
        "report",
        "block",
        "message",
        "follow",
        "friend",
        "share",
        "like",
        "comment",
        "photo",
        "video",
        "post",
        "reel",
        "story",
        "watch",
      ];

      const candidates = [];

      for (const sel of introSelectors) {
        for (const el of document.querySelectorAll(sel)) {
          const text = (el.textContent || "").trim();
          const textLC = text.toLowerCase();

          if (
            text.length >= 15 &&
            text.length <= 500 &&
            !el.closest(
              'a, button, [role="button"], [role="link"], h1, h2, h3, h4',
            ) &&
            !junk.some((j) => textLC === j) &&
            text.includes(" ") &&
            textLC !== nameLC &&
            !textLC.startsWith("lives in") &&
            !textLC.startsWith("joined") &&
            !textLC.startsWith("followed by") &&
            !el.closest('nav, [role="navigation"], [role="banner"]')
          ) {
            candidates.push(text);
          }
        }
      }

      if (candidates.length) {
        candidates.sort((a, b) => b.length - a.length);
        return candidates[0];
      }

      for (const sel of [
        'meta[property="og:description"]',
        'meta[name="description"]',
      ]) {
        const el = document.querySelector(sel);
        const content = el?.content?.trim() || "";
        if (
          content.length > 10 &&
          !content.toLowerCase().includes("facebook") &&
          !content.toLowerCase().includes("log in") &&
          !content.toLowerCase().includes("sign up")
        ) {
          return content;
        }
      }
    } catch (_) {}
    return "";
  }

  function getInstagram() {
    try {
      const links = document.querySelectorAll(
        'a[href*="instagram.com"], a[href*="l.php"]',
      );
      for (const a of links) {
        let href = a.href || "";
        if (href.includes("l.php") || href.includes("facebook.com/l")) {
          try {
            const u = new URL(href);
            const t = u.searchParams.get("u");
            if (t) href = decodeURIComponent(t);
          } catch (_) {}
        }
        if (!href.includes("instagram.com")) continue;
        const m = href.match(
          /https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?/,
        );
        if (m?.[2]) {
          const handle = m[2];
          // Reject invalid/stub handles
          if (
            [
              "p",
              "reel",
              "stories",
              "explore",
              "accounts",
              "_u",
              "_n",
              "about",
              "directory",
            ].includes(handle)
          )
            continue;
          if (handle.length < 2) continue;
          return `https://www.instagram.com/${handle}/`;
        }
      }
    } catch (_) {}
    return "";
  }

  function getEmails() {
    const set = new Set();
    const deny = [
      "example.com",
      "sentry.",
      "domain.com",
      "yoursite",
      "noreply",
      "no-reply",
      "facebook.com",
    ];

    try {
      document.querySelectorAll('a[href^="mailto:"]').forEach((a) => {
        try {
          const raw = decodeURIComponent(a.href.replace("mailto:", ""))
            .split("?")[0]
            .trim()
            .toLowerCase();
          if (raw && !deny.some((d) => raw.includes(d))) set.add(raw);
        } catch (_) {}
      });

      const re =
        /\b([a-zA-Z0-9._+\-]{1,64}@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6})\b/g;
      const contentRoot =
        document.querySelector('[role="main"]') || document.body;
      const text = contentRoot.innerText || "";
      let m;
      while ((m = re.exec(text)) !== null) {
        const e = m[1].toLowerCase();
        if (!deny.some((d) => e.includes(d))) set.add(e);
      }
    } catch (_) {}
    return [...set];
  }

  function getPhoneNumbers() {
    const set = new Set();
    try {
      // Look for typical phone links
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        const raw = a.href.replace("tel:", "").trim();
        if (raw.length > 6) set.add(raw);
      });
      // Fallback text regex
      const re = /\b(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
      const text =
        (document.querySelector('[role="main"]') || document.body).innerText ||
        "";
      let m;
      while ((m = re.exec(text)) !== null) {
        set.add(m[0].trim());
      }
    } catch (_) {}
    return [...set];
  }

  function isVerified() {
    try {
      // Look for the blue checkmark SVG by typical text content or label
      const els = document.querySelectorAll(
        'svg[aria-label="Verified"], svg[aria-label="Verified account"]',
      );
      if (els.length > 0) return true;
      // Some cases Facebook uses title tags in SVGs
      const titles = document.querySelectorAll("svg title");
      for (const t of titles) {
        if (
          t.textContent === "Verified" ||
          t.textContent === "Verified account"
        )
          return true;
      }
    } catch (_) {}
    return false;
  }

  function extractAll() {
    if (extractionCache && Date.now() - extractionCache.time < 5000) {
      return extractionCache.data;
    }
    const name = getPageName();
    const data = {
      name,
      url: window.location.href,
      emails: getEmails(),
      phones: getPhoneNumbers(),
      verified: isVerified(),
      bio: getBio(name),
      insta: getInstagram(),
    };
    extractionCache = { data, time: Date.now() };
    return data;
  }

  /* ── UI UPDATES ── */
  function clip(s, n) {
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  function setPreview(d) {
    const eStr = d.emails.length ? d.emails.join(", ") : "";
    wpEmail.textContent = eStr ? clip(eStr, 28) : "Not found";
    wpEmail.className = "wam-rv " + (eStr ? "ok" : "nil");
    wpName.textContent = d.name ? clip(d.name, 28) : "—";
    wpName.className = "wam-rv " + (d.name ? "ok" : "nil");
    wpUrl.textContent = clip(d.url, 28);
    wpUrl.className = "wam-rv ok";
    wpBio.textContent = d.bio ? clip(d.bio, 28) : "Not found";
    wpBio.className = "wam-rv " + (d.bio ? "ok" : "nil");
    wpInsta.textContent = d.insta ? clip(d.insta, 28) : "Not found";
    wpInsta.className = "wam-rv " + (d.insta ? "ok" : "nil");
  }

  /* ── CLIPBOARD ── */
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

  /* ── FEEDBACK ── */
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

  async function revealHiddenInfo() {
    try {
      // Find "See more" or "Contact and basic info" links
      const links = Array.from(
        document.querySelectorAll(
          'div[role="button"], a[role="link"], span[dir="auto"]',
        ),
      );
      let clicked = false;
      for (const el of links) {
        const text = el.innerText?.toLowerCase().trim();
        if (
          text === "see more" ||
          text === "contact info" ||
          text === "contact and basic info"
        ) {
          el.click();
          clicked = true;
        }
      }
      // Scroll to trigger lazy loading
      window.scrollBy(0, 500);
      if (clicked) await new Promise((r) => setTimeout(r, 100));
    } catch (e) {}
  }

  async function copyBothClips() {
    if (isExtracting) return;
    isExtracting = true;

    setStatus("w", "Analyzing page...", "wam-warning");
    setBtn(btnC, "processing", I.clip, "Copy Details + Email");

    await revealHiddenInfo();
    await new Promise((r) => setTimeout(r, 30));

    const d = extractAll();
    setPreview(d);

    // Send details to background for storage (lightweight, low memory)
    try {
      chrome.runtime.sendMessage(
        { action: "savePageDetails", details: d },
        (response) => {
          if (chrome.runtime.lastError) {
            // Ignore error if background worker is inactive
            void chrome.runtime.lastError;
          }
        },
      );
    } catch (e) {
      // Fail silently; storage is best-effort
    }

    const emailText = d.emails.length ? d.emails.join(", ") : "No_Email_Found";
    const detailsText = [
      `Guest FB Page Name: ${d.name || "Unknown"}`,
      `Guest FB Page Link: ${d.url}`,
      `Guest Bio: "${d.bio || ""}"`,
      `Guest IG Link: ${d.insta || ""}`,
    ].join("\n");

    const ok1 = await writeClipboard(detailsText);
    await new Promise((r) => setTimeout(r, 800));
    const ok2 = await writeClipboard(emailText);

    const ok = ok1 && ok2;

    if (ok) {
      setStatus("", "2 clips ready — Ctrl+V or Win+V", "wam-active");
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
      if (msg.action === "triggerCopy") {
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
          isProfile: typeof isProfile === "function" ? isProfile() : false,
        });
      }
      if (msg.action === "checkProfile") {
        sendResponse({
          isProfile: typeof isProfile === "function" ? isProfile() : false,
        });
      }
    });
  } catch (_) {}

  /* ── PROFILE VS PAGE DETECTION ── */
  function isProfile() {
    const alUrl = document.querySelector('meta[property="al:android:url"]');
    if (alUrl && alUrl.content.includes("fb://profile/")) return true;
    if (alUrl && alUrl.content.includes("fb://page/")) return false;

    const hasFriendsTab = document.querySelector('a[href*="/friends"]');
    if (hasFriendsTab) return true;

    // Lightweight check instead of iterating all buttons
    const friendBtn = document.querySelector(
      '[aria-label="Add friend"], [aria-label="Friends"]',
    );
    // Pages usually have "Follow" or "Like", Profiles have "Add friend" or just "Friends" if already friends
    // But honestly alUrl and friends tab cover 95% of cases.
    return (
      !!friendBtn || !!document.querySelector('a[href*="/friends_mutual"]')
    );
  }

  function checkProfileState() {
    const isProf = isProfile();
    const root = document.getElementById("wam-root");
    if (root) {
      if (isProf) {
        root.classList.add("wam-profile-mode");
      } else {
        root.classList.remove("wam-profile-mode");
      }
    }
  }

  /* ── REELS HIGHLIGHTER ── */
  function processReels() {
    // Process the first 14 reels
    const allReels = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
    const targetReels = allReels.slice(0, 14);

    targetReels.forEach((reel) => {
      // Skip if we already colored this reel to save CPU/RAM
      if (reel.dataset.wamHighlight) return;

      const textNodes = Array.from(reel.querySelectorAll("span, div")).map(
        (el) => el.innerText?.trim(),
      );
      let views = 0;

      for (const text of textNodes) {
        if (!text) continue;
        const match = text.match(/([\d.]+)\s*([KkMm])/);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === "K") views = num * 1000;
          if (unit === "M") views = num * 1000000;
          break;
        } else if (text.match(/^[\d,]+$/)) {
          const numStr = text.replace(/,/g, "");
          if (numStr.length > 3) {
            views = parseInt(numStr, 10);
            if (views > 1000) break;
          }
        }
      }

      if (views >= 40000) {
        reel.style.border = "4px solid #10b981";
        reel.style.borderRadius = "8px";
        reel.style.boxSizing = "border-box";
        reel.dataset.wamHighlight = "green";
      } else if (views >= 11000) {
        reel.style.border = "4px solid #3b82f6";
        reel.style.borderRadius = "8px";
        reel.style.boxSizing = "border-box";
        reel.dataset.wamHighlight = "blue";
      } else {
        reel.dataset.wamHighlight = "none"; // Mark as processed even if no color
      }
    });
  }

  /* ── KEYBOARD SHORTCUT (FALLBACK & ENHANCEMENT) ── */
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === "q") {
      // Avoid triggering when typing in inputs
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );
      
      if (!isInput) {
        e.preventDefault();
        e.stopPropagation();
        
        if (typeof collapsed !== "undefined" && collapsed) {
          collapsed = false;
          if (body) body.classList.remove("wam-collapsed");
          if (colBtn) {
            colBtn.innerHTML = I.collapse;
            colBtn.title = "Collapse";
          }
        }
        if (panel) panel.classList.remove("wam-hidden");
        
        copyBothClips();
      }
    }
  });

  setInterval(() => {
    checkProfileState();
    processReels();
  }, 2500);
})();
