# Loren's Text Replacer

A Chrome extension that expands short `/keyword` commands into full text snippets — instantly, as you type.

**Version 2.15**

---

## What It Does

Whenever you type a shortcode followed by a **Space** or **Enter** in any text field or textarea on any website, the extension automatically replaces it with the full text you've defined.

**Example:**
- You define a shortcode: `/standup` → `Attended standup, reviewed PRs, working on auth module today.`
- You type `/standup` in any text box, then press Space or Enter
- The shortcode is instantly replaced with the full text

Works on standard text inputs, textareas, and rich text fields across virtually all websites, including React-based apps.

---

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the extension folder
5. The extension icon will appear in your Chrome toolbar

---

## Using the Extension

Click the extension icon in the Chrome toolbar to open the management popup.

### Adding a Shortcode

1. Click **+ Add New Shortcode**
2. Enter a **Keyword** (letters, numbers, dashes, and underscores only — the `/` is added automatically)
3. Enter the **Replacement Text** — this is what the keyword will expand to
4. Click **Add Shortcut**

### Editing a Shortcode

1. Find the shortcode in the **Saved Shortcuts** list
2. Click **Edit** on that row
3. Modify the keyword or replacement text
4. Click **Save Changes**

### Deleting a Shortcode

Click **Delete** on any shortcode row. The shortcode is removed immediately.

### Copying a Shortcode's Text

Click **Copy** on any shortcode row to copy the replacement text to your clipboard — useful for one-off pastes without typing the shortcode.

### Searching Shortcuts

Use the **Search** box in the Saved Shortcuts panel to filter by keyword or replacement text.

---

## Triggering a Shortcode

Type your shortcode in any text field and press **Space** or **Enter** to trigger the expansion. The trigger character is automatically removed — only the expanded text remains.

**Example:** Typing `/test ` (with a space) replaces the entire `/test` with its defined replacement text.

---

## Import / Export

Shortcodes can be backed up and restored using JSON files.

### Export
Click **Export JSON** to download all your shortcuts as a `textReplacerBackup.json` file.

### Import
Click **Import JSON** and select a previously exported `.json` file. Imported shortcuts are merged with your existing ones.

**JSON format:**
```json
{
  "/keyword": "Replacement text goes here",
  "/standup": "Attended standup, reviewed PRs, working on auth module today.",
  "/sig": "Best regards,\nLoren"
}
```

---

## Notes

- Shortcodes must start with `/` followed by letters, numbers, dashes, or underscores (e.g. `/my-shortcode`, `/note1`)
- Shortcodes are stored in Chrome's sync storage and available across your signed-in Chrome sessions
- The extension works on all websites (`<all_urls>`) including React and other framework-based apps
- Shortcode expansion does not trigger inside password fields or non-editable elements

---

## Changelog

### v2.15
- Import/Export buttons now always visible (no longer hidden behind the Add form)
- Saved Shortcuts list hidden while Add/Edit form is open for a cleaner workflow
- Fixed shortcode reversion bug on React-controlled inputs (e.g. Instabug/luciq) by dispatching a native input event after expansion

### v2.1
- Collapsed Add/Edit form behind a single **+ Add New Shortcode** button
- Cancel button added to the Add/Edit form
- Fixed layout stretch issues

### v2.0
- Modernized UI
- Shortcode trigger changes

### v1.6
- Import/Export JSON functionality added

### v1.x
- Copy to Clipboard button per shortcode row
