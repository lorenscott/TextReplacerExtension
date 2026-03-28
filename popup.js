const entryForm = document.getElementById('entryForm');
const keywordInput = document.getElementById('keyword');
const textInput = document.getElementById('text');
const searchInput = document.getElementById('search');
const addButton = document.getElementById('add');
const saveButton = document.getElementById('save');
const cancelEditButton = document.getElementById('cancelEdit');
const importButton = document.getElementById('import');
const exportButton = document.getElementById('export');
const fileInput = document.getElementById('fileInput');
const modeBadge = document.getElementById('modeBadge');
const savedItemsDiv = document.getElementById('savedItems');
const emptyState = document.getElementById('emptyState');
const messageDiv = document.getElementById('message');
const keywordError = document.getElementById('keywordError');
const textError = document.getElementById('textError');

const state = {
  isEditing: false,
  originalKeyword: null,
  items: {},
  filterQuery: '',
  messageTimer: null,
  isBusy: false
};

function normalizeKeyword(rawKeyword) {
  const cleaned = rawKeyword.trim();
  if (!cleaned) {
    return '';
  }
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function toDisplayKeyword(keyword) {
  return keyword.startsWith('/') ? keyword.substring(1) : keyword;
}

function setMode(isEditing) {
  state.isEditing = isEditing;
  addButton.style.display = isEditing ? 'none' : 'inline-flex';
  saveButton.style.display = isEditing ? 'inline-flex' : 'none';
  cancelEditButton.style.display = isEditing ? 'inline-flex' : 'none';

  if (isEditing && state.originalKeyword) {
    modeBadge.textContent = `Editing ${state.originalKeyword}`;
  } else {
    modeBadge.textContent = 'Add mode';
  }
}

function setBusy(isBusy) {
  state.isBusy = isBusy;
  const controls = [
    addButton,
    saveButton,
    cancelEditButton,
    importButton,
    exportButton,
    keywordInput,
    textInput,
    searchInput
  ];

  controls.forEach((control) => {
    control.disabled = isBusy;
  });
}

function clearFieldErrors() {
  keywordError.textContent = '';
  textError.textContent = '';
  keywordInput.classList.remove('has-error');
  textInput.classList.remove('has-error');
  keywordInput.parentElement.classList.remove('has-error');
}

function validateFields(showErrors) {
  const rawKeyword = keywordInput.value.trim();
  const textValue = textInput.value;
  const keywordPattern = /^[A-Za-z0-9_-]+$/;
  let keywordMessage = '';
  let textMessage = '';

  if (!rawKeyword) {
    keywordMessage = 'Keyword is required.';
  } else {
    const keywordWithoutSlash = rawKeyword.startsWith('/') ? rawKeyword.substring(1) : rawKeyword;
    if (!keywordPattern.test(keywordWithoutSlash)) {
      keywordMessage = 'Use only letters, numbers, dashes, or underscores.';
    }
  }

  if (!textValue.trim()) {
    textMessage = 'Replacement text is required.';
  }

  if (showErrors) {
    keywordError.textContent = keywordMessage;
    textError.textContent = textMessage;
    keywordInput.classList.toggle('has-error', Boolean(keywordMessage));
    keywordInput.parentElement.classList.toggle('has-error', Boolean(keywordMessage));
    textInput.classList.toggle('has-error', Boolean(textMessage));
  }

  return {
    isValid: !keywordMessage && !textMessage,
    keyword: normalizeKeyword(rawKeyword),
    text: textValue,
    keywordMessage,
    textMessage
  };
}

function showMessage(msg, type) {
  clearTimeout(state.messageTimer);
  messageDiv.className = `toast ${type} show`;
  messageDiv.textContent = msg;

  state.messageTimer = setTimeout(function() {
    messageDiv.classList.remove('show');
    state.messageTimer = setTimeout(function() {
      messageDiv.textContent = '';
      messageDiv.className = 'toast';
    }, 160);
  }, 3200);
}

function clearInputFields() {
  keywordInput.value = '';
  textInput.value = '';
  clearFieldErrors();
}

function filterEntries(items, filterQuery) {
  const entries = Object.entries(items).filter(function([key, value]) {
    return typeof value === 'string' && key.startsWith('/');
  });

  entries.sort(function(a, b) {
    return a[0].localeCompare(b[0]);
  });

  if (!filterQuery.trim()) {
    return entries;
  }

  const normalizedFilter = filterQuery.toLowerCase();
  return entries.filter(function([key, value]) {
    return key.toLowerCase().includes(normalizedFilter) || value.toLowerCase().includes(normalizedFilter);
  });
}

function createSavedItemElement(keyword, text, index) {
  const itemDiv = document.createElement('article');
  itemDiv.className = 'saved-item';
  itemDiv.style.setProperty('--item-index', String(index));
  itemDiv.setAttribute('role', 'listitem');
  itemDiv.setAttribute('data-keyword', keyword);

  const itemHead = document.createElement('div');
  itemHead.className = 'item-head';

  const keywordChip = document.createElement('span');
  keywordChip.className = 'keyword-chip';
  keywordChip.textContent = keyword;

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'item-btn';
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('data-action', 'edit');
  editBtn.setAttribute('data-keyword', keyword);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'item-btn delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('data-action', 'delete');
  deleteBtn.setAttribute('data-keyword', keyword);

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  itemHead.appendChild(keywordChip);
  itemHead.appendChild(actions);

  const textValue = document.createElement('p');
  textValue.className = 'item-text';
  textValue.textContent = text;

  itemDiv.appendChild(itemHead);
  itemDiv.appendChild(textValue);

  return itemDiv;
}

function renderSavedItems(highlightKeyword) {
  const entries = filterEntries(state.items, state.filterQuery);
  savedItemsDiv.innerHTML = '';

  entries.forEach(function([keyword, text], index) {
    const itemEl = createSavedItemElement(keyword, text, index);
    savedItemsDiv.appendChild(itemEl);
  });

  emptyState.classList.toggle('hidden', entries.length > 0);

  if (highlightKeyword) {
    const safeKeyword = CSS.escape(highlightKeyword);
    const targetEl = savedItemsDiv.querySelector(`[data-keyword='${safeKeyword}']`);
    if (targetEl) {
      targetEl.classList.add('highlight');
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(function() {
        targetEl.classList.remove('highlight');
      }, 1400);
    }
  }
}

function loadSavedItems(highlightKeyword) {
  chrome.storage.sync.get(null, function(items) {
    state.items = items || {};
    renderSavedItems(highlightKeyword);
  });
}

function enterEditMode(keyword, text) {
  state.originalKeyword = keyword;
  keywordInput.value = toDisplayKeyword(keyword);
  textInput.value = text;
  setMode(true);
  clearFieldErrors();
  keywordInput.focus();
  keywordInput.select();
}

function exitEditMode() {
  state.originalKeyword = null;
  setMode(false);
  clearInputFields();
}

function addEntry(keyword, text) {
  setBusy(true);
  chrome.storage.sync.get(keyword, function(items) {
    if (items[keyword]) {
      setBusy(false);
      showMessage('Keyword already exists.', 'error');
      keywordError.textContent = 'This keyword is already saved.';
      keywordInput.classList.add('has-error');
      keywordInput.parentElement.classList.add('has-error');
      return;
    }

    const update = {};
    update[keyword] = text;
    chrome.storage.sync.set(update, function() {
      setBusy(false);
      if (chrome.runtime.lastError) {
        showMessage(`Error saving data: ${chrome.runtime.lastError.message}`, 'error');
        return;
      }

      showMessage('Keyword added successfully.', 'success');
      clearInputFields();
      loadSavedItems(keyword);
      keywordInput.focus();
    });
  });
}

function saveEntry(keyword, text) {
  const originalKeyword = state.originalKeyword;
  setBusy(true);

  chrome.storage.sync.get([originalKeyword, keyword], function(items) {
    const isRenaming = originalKeyword !== keyword;
    if (isRenaming && items[keyword]) {
      setBusy(false);
      showMessage('Cannot rename because that keyword already exists.', 'error');
      keywordError.textContent = 'Another shortcut already uses this keyword.';
      keywordInput.classList.add('has-error');
      keywordInput.parentElement.classList.add('has-error');
      return;
    }

    const update = {};
    update[keyword] = text;

    const afterWrite = function() {
      chrome.storage.sync.set(update, function() {
        setBusy(false);
        if (chrome.runtime.lastError) {
          showMessage(`Error saving data: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }

        showMessage('Keyword updated successfully.', 'success');
        exitEditMode();
        loadSavedItems(keyword);
        keywordInput.focus();
      });
    };

    if (isRenaming) {
      chrome.storage.sync.remove(originalKeyword, function() {
        if (chrome.runtime.lastError) {
          setBusy(false);
          showMessage(`Error saving data: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }
        afterWrite();
      });
      return;
    }

    afterWrite();
  });
}

function deleteEntry(keyword) {
  setBusy(true);
  chrome.storage.sync.remove(keyword, function() {
    setBusy(false);
    if (chrome.runtime.lastError) {
      showMessage(`Error deleting keyword: ${chrome.runtime.lastError.message}`, 'error');
      return;
    }
    if (state.originalKeyword === keyword) {
      exitEditMode();
    }
    showMessage('Keyword deleted.', 'info');
    loadSavedItems();
  });
}

function getExportableItems(items) {
  const exportItems = {};
  Object.keys(items).forEach(function(key) {
    if (key.startsWith('/') && typeof items[key] === 'string') {
      exportItems[key] = items[key];
    }
  });
  return exportItems;
}

function normalizeImportedItems(items) {
  const normalized = {};
  Object.keys(items).forEach(function(rawKey) {
    const value = items[rawKey];
    if (typeof value !== 'string') {
      return;
    }

    const normalizedKey = normalizeKeyword(rawKey);
    if (!normalizedKey) {
      return;
    }

    const keywordWithoutSlash = normalizedKey.substring(1);
    if (!/^[A-Za-z0-9_-]+$/.test(keywordWithoutSlash)) {
      return;
    }

    normalized[normalizedKey] = value;
  });

  return normalized;
}

entryForm.addEventListener('submit', function(event) {
  event.preventDefault();
  if (state.isBusy) {
    return;
  }

  clearFieldErrors();
  const validation = validateFields(true);
  if (!validation.isValid) {
    showMessage('Please fix the highlighted fields.', 'error');
    return;
  }

  if (state.isEditing) {
    saveEntry(validation.keyword, validation.text);
  } else {
    addEntry(validation.keyword, validation.text);
  }
});

keywordInput.addEventListener('input', function() {
  validateFields(true);
});

textInput.addEventListener('input', function() {
  validateFields(true);
});

cancelEditButton.addEventListener('click', function() {
  exitEditMode();
  showMessage('Edit canceled.', 'info');
});

searchInput.addEventListener('input', function() {
  state.filterQuery = searchInput.value;
  renderSavedItems();
});

savedItemsDiv.addEventListener('click', function(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || state.isBusy) {
    return;
  }

  const action = button.getAttribute('data-action');
  const keyword = button.getAttribute('data-keyword');
  if (!keyword) {
    return;
  }

  if (action === 'edit') {
    enterEditMode(keyword, state.items[keyword]);
    showMessage(`Editing ${keyword}`, 'info');
    return;
  }

  if (action === 'delete') {
    deleteEntry(keyword);
  }
});

exportButton.addEventListener('click', function() {
  chrome.storage.sync.get(null, function(items) {
    const exportItems = getExportableItems(items || {});
    const fileName = 'textReplacerBackup.json';
    const data = JSON.stringify(exportItems, null, 2);
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`;
    const downloadAnchorNode = document.createElement('a');

    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showMessage('Export complete.', 'success');
  });
});

importButton.addEventListener('click', function() {
  fileInput.click();
});

fileInput.addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file || !file.name.toLowerCase().endsWith('.json')) {
    showMessage('Please select a valid JSON file.', 'error');
    fileInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(loadEvent) {
    try {
      const parsed = JSON.parse(loadEvent.target.result);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        showMessage('Invalid JSON structure. Expected an object.', 'error');
        return;
      }

      const normalized = normalizeImportedItems(parsed);
      chrome.storage.sync.set(normalized, function() {
        if (chrome.runtime.lastError) {
          showMessage(`Error importing items: ${chrome.runtime.lastError.message}`, 'error');
          return;
        }

        const count = Object.keys(normalized).length;
        showMessage(`Imported ${count} shortcut${count === 1 ? '' : 's'}.`, 'success');
        loadSavedItems();
      });
    } catch (error) {
      showMessage('Could not parse JSON file.', 'error');
      console.error('Import error:', error);
    } finally {
      fileInput.value = '';
    }
  };

  reader.readAsText(file);
});

setMode(false);
loadSavedItems();