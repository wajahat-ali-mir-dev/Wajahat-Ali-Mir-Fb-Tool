/**
 * Wajahat Ali Mir Toolkit v3.0 — Background Service Worker
 * Optimized for MV3 with enhanced error handling, caching, and performance
 * 
 * Features:
 * - Request deduplication
 * - Enhanced error handling with retry logic
 * - Tab state tracking
 * - Performance metrics logging
 * - Graceful degradation
 */

"use strict";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Timing
  MESSAGE_TIMEOUT: 5000,        // 5 seconds for content script response
  RETRY_DELAY: 300,             // 300ms between retries
  MAX_RETRIES: 2,               // Maximum retry attempts

  // Features
  ENABLE_LOGGING: true,         // Console logging for debugging
  ENABLE_METRICS: true,         // Performance metrics

  // URLs
  ALLOWED_DOMAINS: [
    'facebook.com',
    'www.facebook.com',
    'web.facebook.com',
    'm.facebook.com'
  ]
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Track active extractions to prevent duplicates
const activeExtractions = new Map();

// Cache for recent extractions (tabId -> {data, timestamp})
const extractionCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Performance metrics
const metrics = {
  totalExtractions: 0,
  successfulExtractions: 0,
  failedExtractions: 0,
  averageResponseTime: 0
};

// ============================================================================
// LOGGING UTILITY
// ============================================================================

const Logger = {
  debug: (...args) => CONFIG.ENABLE_LOGGING && console.log('[WAM]', ...args),
  info: (...args) => CONFIG.ENABLE_LOGGING && console.info('[WAM]', ...args),
  warn: (...args) => CONFIG.ENABLE_LOGGING && console.warn('[WAM]', ...args),
  error: (...args) => CONFIG.ENABLE_LOGGING && console.error('[WAM]', ...args),

  metric: (name, value) => {
    if (CONFIG.ENABLE_METRICS) {
      console.log(`[WAM Metric] ${name}:`, value);
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if URL is allowed for extraction
 * @param {string} url 
 * @returns {boolean}
 */
function isAllowedUrl(url) {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return CONFIG.ALLOWED_DOMAINS.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if content script is alive
 * @param {number} tabId 
 * @returns {Promise<boolean>}
 */
async function isContentScriptAlive(tabId) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 1000);

    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      clearTimeout(timeout);
      resolve(chrome.runtime.lastError ? false : !!response?.alive);
    });
  });
}

/**
 * Inject content script with retry
 * @param {number} tabId 
 * @param {number} retries 
 * @returns {Promise<boolean>}
 */
async function injectContentScript(tabId, retries = 0) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-utils.js", "content-extractor.js", "content-ui.js"]
    });

    // Wait for script to initialize
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify injection
    const isAlive = await isContentScriptAlive(tabId);
    if (isAlive) {
      Logger.debug('Content script injected successfully');
      return true;
    }

    throw new Error('Content script not responding after injection');

  } catch (error) {
    Logger.error('Injection failed:', error);

    if (retries < CONFIG.MAX_RETRIES) {
      Logger.warn(`Retrying injection (${retries + 1}/${CONFIG.MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      return injectContentScript(tabId, retries + 1);
    }

    return false;
  }
}

/**
 * Send message to content script with timeout
 * @param {number} tabId 
 * @param {Object} message 
 * @returns {Promise<Object|null>}
 */
async function sendMessageToContent(tabId, message) {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const timeout = setTimeout(() => {
      Logger.warn('Message timeout');
      resolve(null);
    }, CONFIG.MESSAGE_TIMEOUT);

    try {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        clearTimeout(timeout);

        if (chrome.runtime.lastError) {
          Logger.debug('Message error:', chrome.runtime.lastError.message);
          resolve(null);
          return;
        }

        const duration = performance.now() - startTime;
        Logger.metric('Response time', `${duration.toFixed(2)}ms`);

        resolve(response);
      });
    } catch (error) {
      clearTimeout(timeout);
      Logger.error('Send message error:', error);
      resolve(null);
    }
  });
}

// ============================================================================
// CORE EXTRACTION LOGIC
// ============================================================================

/**
 * Execute extraction with full error handling
 * @param {number} tabId 
 * @returns {Promise<Object>}
 */
async function executeExtraction(tabId) {
  // Check for duplicate requests
  if (activeExtractions.has(tabId)) {
    Logger.warn('Duplicate request, returning existing');
    return activeExtractions.get(tabId);
  }

  // Check cache
  const cached = extractionCache.get(tabId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    Logger.debug('Returning cached result');
    return { success: true, cached: true, ...cached.data };
  }

  // Create extraction promise
  const extractionPromise = performExtraction(tabId);
  activeExtractions.set(tabId, extractionPromise);

  try {
    const result = await extractionPromise;

    // Update cache on success
    if (result.success) {
      extractionCache.set(tabId, {
        data: result,
        timestamp: Date.now()
      });
      metrics.successfulExtractions++;
    } else {
      metrics.failedExtractions++;
    }

    metrics.totalExtractions++;
    return result;

  } finally {
    activeExtractions.delete(tabId);
  }
}

/**
 * Perform actual extraction
 * @param {number} tabId 
 * @returns {Promise<Object>}
 */
async function performExtraction(tabId) {
  const startTime = performance.now();

  try {
    // Step 1: Check if content script is alive
    let isAlive = await isContentScriptAlive(tabId);

    // Step 2: Inject if needed
    if (!isAlive) {
      Logger.info('Injecting content script...');
      const injected = await injectContentScript(tabId);

      if (!injected) {
        return {
          success: false,
          error: 'Failed to inject content script',
          code: 'INJECTION_FAILED'
        };
      }
    }

    // Step 3: Send extraction command
    Logger.debug('Sending extraction command...');
    const response = await sendMessageToContent(tabId, { action: "triggerCopy" });

    if (!response) {
      return {
        success: false,
        error: 'No response from content script',
        code: 'NO_RESPONSE'
      };
    }

    const duration = performance.now() - startTime;
    Logger.metric('Total extraction time', `${duration.toFixed(2)}ms`);

    return {
      success: !!response.success,
      duration: Math.round(duration),
      ...response
    };

  } catch (error) {
    Logger.error('Extraction error:', error);
    return {
      success: false,
      error: error.message,
      code: 'EXCEPTION'
    };
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle keyboard shortcut command
 */
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "trigger-copy") return;

  Logger.info('Keyboard shortcut triggered');

  try {
    // Check if extension is enabled
    const { extensionEnabled = true } = await chrome.storage.local.get({ extensionEnabled: true });
    if (!extensionEnabled) {
      Logger.info('Extension is disabled, ignoring shortcut');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (!tab?.id) {
      Logger.warn('No active tab');
      return;
    }

    // Validate URL
    if (!isAllowedUrl(tab.url)) {
      Logger.warn('Invalid page:', tab.url);

      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'wajahat_ali_mir Toolkit',
        message: 'This extension only works on Facebook pages'
      });

      return;
    }

    // Execute extraction
    const result = await executeExtraction(tab.id);

    if (!result.success) {
      Logger.error('Extraction failed:', result.error);
    } else {
      Logger.info('Extraction successful');
    }

  } catch (error) {
    Logger.error('Command handler error:', error);
  }
});

/**
 * Handle tab updates (cleanup when leaving Facebook)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && !isAllowedUrl(changeInfo.url)) {
    extractionCache.delete(tabId);
    Logger.debug('Cleaned cache for tab:', tabId);
  }
});

/**
 * Handle tab removal (cleanup)
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  extractionCache.delete(tabId);
  activeExtractions.delete(tabId);
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.action) {
      case 'getMetrics':
        return {
          success: true,
          metrics: { ...metrics },
          cacheSize: extractionCache.size
        };

      case 'clearData': {
        return new Promise((resolve) => {
          chrome.storage.local.set({ pageDetails: [] }, () => {
            Logger.info('Page details cleared');
            resolve({ success: true });
          });
        });
      }

      case 'clearCache':
        extractionCache.clear();
        Logger.info('Cache cleared');
        return { success: true };

      case 'getStoredData': {
        return new Promise((resolve) => {
          chrome.storage.local.get({ pageDetails: [] }, (result) => {
            resolve({ success: true, data: result.pageDetails });
          });
        });
      }

      case 'deleteEntry': {
        const index = message.index;
        if (typeof index !== 'number') {
          return { success: false, error: 'Invalid index' };
        }
        chrome.storage.local.get({ pageDetails: [] }, (result) => {
          const arr = result.pageDetails;
          if (index >= 0 && index < arr.length) {
            arr.splice(index, 1);
            chrome.storage.local.set({ pageDetails: arr }, () => {
              Logger.info(`Deleted entry ${index}`);
            });
          }
        });
        return { success: true };
      }

      case 'ping':
        return { success: true, pong: true };

      // New case: Save page details to persistent storage
      case 'savePageDetails': {
        const details = message.details;
        if (!details) return { success: false, error: 'No details provided' };
        // Retrieve existing array, append, and store back
        return new Promise((resolve) => {
          chrome.storage.local.get({ pageDetails: [] }, (result) => {
            const arr = result.pageDetails;
            arr.push(details);
            chrome.storage.local.set({ pageDetails: arr }, () => {
              resolve({ success: true, storedCount: arr.length });
            });
          });
        });
      }

      // New case: Export stored details as CSV and trigger download
      case 'exportCSV': {
        return new Promise((resolve) => {
          chrome.storage.local.get({ pageDetails: [] }, (result) => {
            const data = result.pageDetails;
            // Convert array of objects to CSV
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            chrome.downloads.download({ url, filename: 'page_details.csv' }, () => {
              resolve({ success: true, exportedCount: data.length });
            });
          });
        });
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  };

  handleAsync().then(sendResponse);
  return true;
});

// Helper: Convert array of objects to CSV string
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';
  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => {
    const val = row[k];
    // Escape double quotes
    const escaped = ('' + val).replace(/"/g, '""');
    return `"${escaped}"`;
  }).join(','));
  return keys.join(',') + '\n' + rows.join('\n');
}

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  const manifest = chrome.runtime.getManifest();

  if (details.reason === 'install') {
    Logger.info(`wajahat_ali_mir Toolkit v${manifest.version} installed`);

    chrome.storage.local.set({
      installDate: Date.now(),
      version: manifest.version
    });

    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'wajahat_ali_mir Toolkit Installed',
      message: 'Press Ctrl+Q on any Facebook page to extract data'
    });

  } else if (details.reason === 'update') {
    Logger.info(`Updated to v${manifest.version}`);
  }
});

// Error handlers
self.onerror = (message, source, lineno, colno, error) => {
  Logger.error('Global error:', { message, source, lineno, error });
  return false;
};

self.onunhandledrejection = (event) => {
  Logger.error('Unhandled rejection:', event.reason);
};

Logger.info('Background service worker initialized');