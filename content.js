console.log('content.js has been loaded.');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyReplacements(text, items) {
  if (!text || !items || typeof items !== 'object') {
    return text;
  }

  const tokenChars = 'A-Za-z0-9_-';
  const triggerChars = ' \\n\\r';
  const sortedEntries = Object.entries(items)
    .filter(([keyword, replacement]) => typeof keyword === 'string' && keyword.startsWith('/') && typeof replacement === 'string')
    .sort((a, b) => b[0].length - a[0].length);

  let updatedText = text;

  sortedEntries.forEach(([keyword, replacement]) => {
    // Require a delimiter after the shortcode so typing /test2 is not interrupted at /test.
    const pattern = new RegExp(`(^|[^${tokenChars}])(${escapeRegex(keyword)})(?=[${triggerChars}])`, 'g');
    updatedText = updatedText.replace(pattern, function(_, prefix) {
      return `${prefix}${replacement}`;
    });
  });

  return updatedText;
}

function applyReplacementsWithCaret(text, items, caretStart, caretEnd) {
  const safeStart = Number.isInteger(caretStart) ? caretStart : text.length;
  const safeEnd = Number.isInteger(caretEnd) ? caretEnd : safeStart;
  const replacedText = applyReplacements(text, items);

  const prefixForStart = text.slice(0, safeStart);
  const prefixForEnd = text.slice(0, safeEnd);
  const replacedPrefixForStart = applyReplacements(prefixForStart, items);
  const replacedPrefixForEnd = applyReplacements(prefixForEnd, items);

  return {
    text: replacedText,
    caretStart: replacedPrefixForStart.length,
    caretEnd: replacedPrefixForEnd.length
  };
}

function getEditableContext(eventTarget) {
  const target = eventTarget;
  const editableTarget = target && typeof target.closest === 'function'
    ? target.closest('[contenteditable="true"]')
    : null;
  const tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
  const isInput = tagName === 'input';
  const isTextarea = tagName === 'textarea';
  const isContentEditable = (target && target.contentEditable === 'true') || Boolean(editableTarget);

  if (!isInput && !isTextarea && !isContentEditable) {
    return null;
  }

  return {
    target,
    editableTarget,
    isInput,
    isTextarea,
    isContentEditable
  };
}

function canUseRuntimeMessaging() {
  const runtime = getRuntime();
  return Boolean(runtime && typeof runtime.sendMessage === 'function' && runtime.id);
}

function getRuntime() {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime : null;
  } catch (_) {
    return null;
  }
}

function hasRuntimeMessagingError() {
  const runtime = getRuntime();
  if (!runtime) {
    return true;
  }

  try {
    return Boolean(runtime.lastError);
  } catch (_) {
    return true;
  }
}

function processReplacement(context) {
  const runtime = getRuntime();
  if (!runtime || !canUseRuntimeMessaging()) {
    // During extension reload (or plain page execution), runtime messaging can be unavailable.
    return;
  }

  try {
    runtime.sendMessage({ action: 'fetchItems' }, function(response) {
      if (hasRuntimeMessagingError()) {
        return;
      }

      const items = response && response.items ? response.items : {};

      if (context.isInput || context.isTextarea) {
        const currentText = context.target.value;
        const selectionStart = context.target.selectionStart;
        const selectionEnd = context.target.selectionEnd;
        const result = applyReplacementsWithCaret(currentText, items, selectionStart, selectionEnd);

        if (result.text !== currentText) {
          const trimmedText = result.text.replace(/[ \n\r]+$/, '');
          context.target.value = trimmedText;
          const clampedStart = Math.min(result.caretStart, trimmedText.length);
          const clampedEnd = Math.min(result.caretEnd, trimmedText.length);
          if (typeof context.target.setSelectionRange === 'function') {
            context.target.setSelectionRange(clampedStart, clampedEnd);
          }
          console.log(`Post-replacement value: "${context.target.value}"`);
        }
        return;
      }

      const contentNode = context.editableTarget || context.target;
      const currentText = contentNode.textContent || '';
      const replacedText = applyReplacements(currentText, items);

      if (replacedText !== currentText) {
        contentNode.textContent = replacedText.replace(/[ \n\r]+$/, '');
        console.log(`Post-replacement text: "${contentNode.textContent}"`);
      }
    });
  } catch (_) {
    // Ignore transient runtime errors during extension reload.
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key !== ' ' && e.key !== 'Enter') {
    return;
  }

  const context = getEditableContext(e.target);
  if (!context) {
    return;
  }

  // Wait until the key press applies, then expand matching shortcodes.
  setTimeout(function() {
    processReplacement(context);
  }, 0);
});
