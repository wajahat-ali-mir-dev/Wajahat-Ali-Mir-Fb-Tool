/**
 * Wajahat Ali Mir Fb Tool — Extractor Module
 * Core data extraction logic optimized for speed and low CPU utilization.
 */
(function () {
  "use strict";

  window.wam = window.wam || {};

  let extractionCache = null;

  /* ── COMPILED REGEXES (Static to module level for memory efficiency) ── */
  const SLUG_REGEX = /^\/([A-Za-z0-9._-]+)\/?/;
  const EMAIL_REGEX = /\b([a-zA-Z0-9._+\-]{1,64}@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,6})\b/g;
  const PHONE_REGEX = /\b(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
  const INSTAGRAM_REGEX = /https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?/;

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
    if (lc.length < 2) return true;
    return false;
  }

  /* ── CLEAN VERIFIED TEXT ── */
  function cleanTextVerified(text) {
    if (!text) return "";
    return text
      .replace(/\bVerified(?:\s+account)?\b[\s\W]*$/i, "")
      .replace(/[\s\(\)\[\]\-\|\•\·\–\—]+$/, "")
      .trim();
  }

  function getElementCleanText(el) {
    if (!el) return "";
    try {
      const clone = el.cloneNode(true);
      // Remove SVGs which often contain "Verified account" title/aria-label/text
      clone.querySelectorAll("svg").forEach(svg => svg.remove());
      // Also remove elements with aria-label containing "Verified"
      clone.querySelectorAll("*").forEach(child => {
        const label = child.getAttribute("aria-label") || "";
        if (label.toLowerCase().includes("verified")) {
          child.remove();
        }
      });
      return cleanTextVerified(clone.textContent || "");
    } catch (_) {
      return cleanTextVerified(el.textContent || "");
    }
  }

  /* ── EXTRACT NAME ── */
  window.wam.getPageName = function () {
    try {
      // 1. Try extracting from URL slug (most reliable on Facebook SPA)
      const path = window.location.pathname;
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
      const slugMatch = path.match(SLUG_REGEX);
      if (
        slugMatch &&
        slugMatch[1] &&
        !systemPaths.has(slugMatch[1].toLowerCase())
      ) {
        const slug = slugMatch[1];
        if (!/^\d+$/.test(slug)) {
          // Try to find display name from h1 inside main content first
          const mainH1 = document.querySelector(
            '[role="main"] h1, [data-pagelet="ProfileActions"] h1',
          );
          if (mainH1) {
            const h1Text = getElementCleanText(mainH1);
            if (h1Text && !isJunkTitle(h1Text) && h1Text.length < 140) {
              return h1Text;
            }
          }
          // Try the profile cover name area
          const profileName = document.querySelector(
            "h1[class] span a, h1 span",
          );
          if (profileName) {
            const pn = getElementCleanText(profileName);
            if (pn && !isJunkTitle(pn) && pn.length > 1 && pn.length < 140) {
              return pn;
            }
          }
          return slug;
        }
      }

      // 2. Try h1 elements inside main content area only
      const mainContent = document.querySelector('[role="main"]');
      if (mainContent) {
        for (const h of mainContent.querySelectorAll("h1")) {
          const t = getElementCleanText(h);
          if (t && t.length > 1 && t.length < 140 && !isJunkTitle(t)) {
            return t;
          }
        }
      }

      // 3. Try og:title but ONLY if not junk
      const og = document.querySelector('meta[property="og:title"]');
      if (og?.content?.trim() && !isJunkTitle(og.content.trim())) {
        return cleanTextVerified(og.content.trim());
      }

      // 4. Fallback: clean document.title
      const cleaned = document.title
        .replace(/\s*[|\-–—]\s*(Facebook|Instagram|LinkedIn).*$/i, "")
        .replace(/^\(\d+\)\s*/, "")
        .trim();
      if (cleaned && !isJunkTitle(cleaned)) return cleanTextVerified(cleaned);

      return "Unknown";
    } catch (_) {
      return "Unknown";
    }
  };

  /* ── EXTRACT BIO (REFINED & FIXED) ── */
  window.wam.getBio = function (pageName) {
    try {
      const nameLC = (pageName || "").toLowerCase().trim();

      const introSelectors = [
        '[data-pagelet="ProfileTilesFeed_0"] span',
        '[data-pagelet="ProfileTilesFeed_0"] div',
        '[data-pagelet="above_fold_sidebar"] span',
        '[data-pagelet="above_fold_sidebar"] div',
        '[data-pagelet*="ProfileHeader"] span',
        '[data-pagelet*="ProfileHeader"] div',
        '[data-pagelet*="ProfileHeader"] [dir="auto"]',
        '[data-pagelet*="Header"] span',
        '[data-pagelet*="Header"] div',
        '[data-pagelet*="Header"] [dir="auto"]',
        '.xp6pnuw span',
        '.xp6pnuw div',
        '.xp6pnuw',
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
        // Common Facebook page categories to avoid extracting them as bio
        "public figure",
        "entrepreneur",
        "digital creator",
        "personal blog",
        "politician",
        "athlete",
        "musician/band",
        "artist",
        "author",
        "business consultant",
        "community",
        "education",
        "entertainment website",
        "gamer",
        "government official",
        "journalist",
        "local business",
        "media/news company",
        "news & media website",
        "product/service",
        "real estate agent",
        "shopping & retail",
        "writer",
        "photographer",
        "musician",
        "band",
        "actor",
        "chef",
        "comedian",
        "fashion designer",
        "news anchor",
        "teacher",
        "scientist",
        "model",
        "coach",
        "speaker"
      ];

      function isValidBioText(text) {
        if (!text) return false;
        const textLC = text.toLowerCase().trim();
        if (text.length < 10 || text.length > 500) return false;
        if (textLC === nameLC) return false;
        if (!text.includes(" ")) return false;
        if (junk.some((j) => textLC === j)) return false;

        // Exclude structured profile details/stats
        if (
          textLC.startsWith("lives in") ||
          textLC.startsWith("joined") ||
          textLC.startsWith("followed by") ||
          textLC.startsWith("works at") ||
          textLC.startsWith("went to") ||
          textLC.startsWith("studies at") ||
          textLC.startsWith("from ") ||
          textLC.startsWith("former ") ||
          textLC.startsWith("studied ") ||
          textLC.startsWith("in a relationship") ||
          textLC.startsWith("single") ||
          textLC.startsWith("married") ||
          textLC.startsWith("divorced") ||
          textLC.startsWith("widowed") ||
          textLC.startsWith("engaged") ||
          textLC.startsWith("relationship") ||
          textLC.startsWith("managing partner") ||
          textLC.startsWith("owner") ||
          textLC.endsWith("followers") ||
          textLC.endsWith("following")
        ) {
          return false;
        }

        return true;
      }

      const candidates = [];

      // Phase 1: Try specific intro card selectors first (high confidence)
      for (const sel of introSelectors) {
        for (const el of document.querySelectorAll(sel)) {
          const text = (el.textContent || "").trim();

          if (
            !el.closest('a, button, [role="button"], [role="link"], h1, h2, h3, h4') &&
            isValidBioText(text)
          ) {
            candidates.push(text);
          }
        }
      }

      if (candidates.length) {
        return candidates[0];
      }

      // Phase 2: Fallback selector scoped to main container with feed/timeline/dialog/composer exclusions
      const fallbackSelectors = [
        'div[class] > div > div > div > span[dir="auto"]',
        'div[class] > div > div > div > span',
        'div[class] > div > div > div > div',
      ];
      const fallbackRoot = document.querySelector('[role="main"]') || document.body;

      for (const sel of fallbackSelectors) {
        for (const el of fallbackRoot.querySelectorAll(sel)) {
          // Exclude elements inside posts, feed, timeline, dialogs, composer
          if (
            el.closest('[role="article"]') ||
            el.closest('[role="feed"]') ||
            el.closest('[data-pagelet*="Timeline"]') ||
            el.closest('[data-pagelet*="Composer"]') ||
            el.closest('[role="dialog"]')
          ) {
            continue;
          }

          const text = (el.textContent || "").trim();

          if (
            !el.closest('a, button, [role="button"], [role="link"], h1, h2, h3, h4') &&
            !el.closest('nav, [role="navigation"], [role="banner"]') &&
            isValidBioText(text)
          ) {
            candidates.push(text);
          }
        }
      }

      if (candidates.length) {
        return candidates[0];
      }

      // Phase 3: Meta descriptions fallback
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
    } catch (_) { }
    return "";
  };

  /* ── EXTRACT INSTAGRAM LINK ── */
  window.wam.getInstagram = function () {
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
          } catch (_) { }
        }
        if (!href.includes("instagram.com")) continue;
        const m = href.match(INSTAGRAM_REGEX);
        if (m?.[2]) {
          const handle = m[2];
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
    } catch (_) { }
    return "";
  };

  /* ── EXTRACT EMAILS ── */
  window.wam.getEmails = function () {
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
        } catch (_) { }
      });

      const contentRoot =
        document.querySelector('[role="main"]') || document.body;
      // textContent is ~100x faster than innerText because it avoids triggering layout reflow
      const text = contentRoot.textContent || "";
      let m;
      EMAIL_REGEX.lastIndex = 0; // Reset regex state
      while ((m = EMAIL_REGEX.exec(text)) !== null) {
        const e = m[1].toLowerCase();
        if (!deny.some((d) => e.includes(d))) set.add(e);
      }
    } catch (_) { }
    return [...set];
  };

  /* ── EXTRACT PHONES ── */
  window.wam.getPhoneNumbers = function () {
    const set = new Set();
    try {
      document.querySelectorAll('a[href^="tel:"]').forEach((a) => {
        const raw = a.href.replace("tel:", "").trim();
        if (raw.length > 6) set.add(raw);
      });
      const contentRoot =
        document.querySelector('[role="main"]') || document.body;
      // textContent is ~100x faster than innerText because it avoids triggering layout reflow
      const text = contentRoot.textContent || "";
      let m;
      PHONE_REGEX.lastIndex = 0; // Reset regex state
      while ((m = PHONE_REGEX.exec(text)) !== null) {
        set.add(m[0].trim());
      }
    } catch (_) { }
    return [...set];
  };

  /* ── CHECK VERIFIED STATUS ── */
  window.wam.isVerified = function () {
    try {
      const els = document.querySelectorAll(
        'svg[aria-label="Verified"], svg[aria-label="Verified account"]',
      );
      if (els.length > 0) return true;
      const titles = document.querySelectorAll("svg title");
      for (const t of titles) {
        if (
          t.textContent === "Verified" ||
          t.textContent === "Verified account"
        )
          return true;
      }
    } catch (_) { }
    return false;
  };

  /* ── EXTRACT ALL AGGREGATE ── */
  window.wam.extractAll = function () {
    if (extractionCache && Date.now() - extractionCache.time < 5000) {
      return extractionCache.data;
    }
    const name = window.wam.getPageName();
    const data = {
      name,
      url: window.location.href,
      emails: window.wam.getEmails(),
      phones: window.wam.getPhoneNumbers(),
      bio: window.wam.getBio(name),
      insta: window.wam.getInstagram(),
    };
    extractionCache = { data, time: Date.now() };
    return data;
  };
})();
