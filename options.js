"use strict";

const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const recordCount = document.getElementById('record-count');
const btnExport = document.getElementById('btn-export');
const btnClear = document.getElementById('btn-clear');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

let allData = [];

// Helper: Show toast notification
function showToast(message, isError = false) {
  toastMsg.textContent = message;
  const svg = toast.querySelector('svg');
  if (isError) {
    svg.setAttribute('stroke', 'var(--danger)');
    svg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
  } else {
    svg.setAttribute('stroke', 'var(--success)');
    svg.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
  }
  
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Helper: Truncate string
function truncate(str, len = 30) {
  if (!str) return '—';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// Render the table
function renderTable(dataToRender) {
  tableBody.innerHTML = '';
  recordCount.textContent = dataToRender.length;

  if (dataToRender.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <p>No records found. Extract some data from Facebook first!</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  dataToRender.forEach((item, index) => {
    const tr = document.createElement('tr');
    
    // Emails column
    const emailsHtml = item.emails && item.emails.length > 0 
      ? item.emails.join('<br>') 
      : '<span style="color:var(--text-muted)">No email</span>';
      
    // URL column
    const urlHtml = item.url 
      ? `<a href="${item.url}" target="_blank" class="url-link truncate" style="display:inline-block" title="${item.url}">Link ↗</a>` 
      : '—';

    tr.innerHTML = `
      <td><div class="truncate" title="${item.name || ''}"><b>${item.name || '—'}</b></div></td>
      <td class="email-cell">${emailsHtml}</td>
      <td>${urlHtml}</td>
      <td><div class="truncate" title="${item.insta || ''}">${item.insta || '—'}</div></td>
      <td><div class="truncate" title="${item.bio || ''}" style="max-width: 250px;">${item.bio || '—'}</div></td>
      <td>
        <svg class="action-icon btn-delete" data-index="${index}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Attach delete listeners
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.currentTarget.getAttribute('data-index');
      deleteRecord(parseInt(idx));
    });
  });
}

// Load data from background via messaging
function loadData() {
  chrome.runtime.sendMessage({ action: 'getStoredData' }, (response) => {
    if (response && response.success) {
      // Reverse so newest is first
      allData = response.data.slice().reverse();
      renderTable(allData);
    } else {
      showToast('Failed to load data', true);
    }
  });
}

// Delete a single record
function deleteRecord(displayIndex) {
  if (confirm('Are you sure you want to delete this record?')) {
    // Because we reversed the array for display, the actual index in storage is different
    const actualIndex = (allData.length - 1) - displayIndex;
    
    chrome.runtime.sendMessage({ action: 'deleteEntry', index: actualIndex }, (response) => {
      if (response && response.success) {
        showToast('Record deleted successfully');
        loadData(); // Reload data
      } else {
        showToast('Failed to delete record', true);
      }
    });
  }
}

// Export CSV
btnExport.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'exportCSV' }, (response) => {
    if (response && response.success) {
      showToast(`Exported ${response.exportedCount} records`);
    } else {
      showToast('Export failed', true);
    }
  });
});

// Clear All
btnClear.addEventListener('click', () => {
  if (confirm('WARNING: This will permanently delete ALL extracted data. Are you sure?')) {
    chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
      if (response && response.success) {
        showToast('All data cleared');
        loadData();
      } else {
        showToast('Clear failed', true);
      }
    });
  }
});

// Search functionality
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allData.filter(item => {
    return (item.name && item.name.toLowerCase().includes(query)) ||
           (item.emails && item.emails.join(' ').toLowerCase().includes(query)) ||
           (item.bio && item.bio.toLowerCase().includes(query)) ||
           (item.url && item.url.toLowerCase().includes(query)) ||
           (item.insta && item.insta.toLowerCase().includes(query));
  });
  renderTable(filtered);
});

// Initial load
document.addEventListener('DOMContentLoaded', loadData);
