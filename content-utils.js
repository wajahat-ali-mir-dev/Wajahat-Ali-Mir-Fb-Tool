/**
 * Wajahat Ali Mir Fb Tool — Utilities Module
 * Safe namespace-isolated utility functions for DOM manipulation and background tasks.
 */
(function () {
  "use strict";

  window.wam = window.wam || {};

  /* ── SAFE CLIPBOARD WRITER ── */
  window.wam.writeClipboard = async function (text) {
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
  };

  /* ── REVEAL LAZY-LOADED/HIDDEN INFO ── */
  window.wam.revealHiddenInfo = async function () {
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
      // Scroll slightly to trigger lazy loading
      window.scrollBy(0, 500);
      if (clicked) await new Promise((r) => setTimeout(r, 100));
    } catch (e) {}
  };

  /* ── PROFILE VS PAGE DETECTION ── */
  window.wam.isProfile = function () {
    const alUrl = document.querySelector('meta[property="al:android:url"]');
    if (alUrl && alUrl.content.includes("fb://profile/")) return true;
    if (alUrl && alUrl.content.includes("fb://page/")) return false;

    const hasFriendsTab = document.querySelector('a[href*="/friends"]');
    if (hasFriendsTab) return true;

    // Lightweight check for "Add friend" or "Friends"
    const friendBtn = document.querySelector(
      '[aria-label="Add friend"], [aria-label="Friends"]',
    );
    return (
      !!friendBtn || !!document.querySelector('a[href*="/friends_mutual"]')
    );
  };

  window.wam.checkProfileState = function () {
    const isProf = window.wam.isProfile();
    const root = document.getElementById("wam-root");
    if (root) {
      if (isProf) {
        root.classList.add("wam-profile-mode");
      } else {
        root.classList.remove("wam-profile-mode");
      }
    }
  };

  /* ── REELS HIGHLIGHTER ── */
  window.wam.processReels = function () {
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
        reel.dataset.wamHighlight = "none";
      }
    });
  };
})();
