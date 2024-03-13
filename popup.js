function loadSavedItems() {
  chrome.storage.sync.get(null, function(items) {
    const savedItemsDiv = document.getElementById('savedItems');
    savedItemsDiv.innerHTML = ''; // Clear the current content

    for (let keyword in items) {
      const itemDiv = document.createElement('div');

      const keywordCaption = document.createElement('span');
      keywordCaption.innerText = "----------------------------------\nKeyword:";
      keywordCaption.className = "caption"; // Add the caption class
      
      const keywordValue = document.createElement('span');
      keywordValue.innerText = ` ${keyword}`;
      keywordValue.setAttribute('data-keyword', keyword.substring(1)); // Use keyword value without the slash as the identifier
      
      const keywordDiv = document.createElement('div');
      keywordDiv.appendChild(keywordCaption);
      keywordDiv.appendChild(keywordValue);

      const textCaption = document.createElement('span');
      textCaption.innerText = "Text:";
      textCaption.className = "caption"; // Add the caption class
      
      const textValue = document.createElement('span');
      textValue.innerText = ` ${items[keyword]}`;
      
      const textDiv = document.createElement('div');
      textDiv.appendChild(textCaption);
      textDiv.appendChild(textValue);

      const editBtn = document.createElement('button');
      editBtn.innerText = 'Edit';
      editBtn.onclick = function() {
        document.getElementById('keyword').value = keyword.substring(1);
        document.getElementById('text').value = items[keyword];
        toggleAddSaveButtons(); // Switch to Save mode        

        // Scroll to the top of the window
        window.scrollTo(0, 0);        
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = 'Delete';
      deleteBtn.onclick = function() {
        chrome.storage.sync.remove(keyword, function() {
          loadSavedItems(); // Refresh the list
        });
      };

      itemDiv.appendChild(keywordDiv);
      itemDiv.appendChild(textDiv);
      itemDiv.appendChild(editBtn);
      itemDiv.appendChild(deleteBtn);
      savedItemsDiv.appendChild(itemDiv);
    }
  });
}


document.getElementById('add').addEventListener('click', function() {
  let keyword = document.getElementById('keyword').value;
  keyword = keyword.startsWith('/') ? keyword : "/" + keyword;
  const textBlock = document.getElementById('text').value;

  if (!keyword || !textBlock) {
    showMessage('Both fields are required!');
    return;
  }

  chrome.storage.sync.get(keyword, function(items) {
    if (items[keyword]) {
      showMessage('Keyword already exists!');
    } else {
      const obj = {};
      obj[keyword] = textBlock;
      chrome.storage.sync.set(obj, function() {
        if (chrome.runtime.lastError) {
          showMessage('Error saving data: ' + chrome.runtime.lastError.message);
          return;
        }
        showMessage('Keyword added successfully.');
        loadSavedItems();  // Refresh the list after addition
        clearInputFields(); // Clear the top input fields
      });
    }
  });
});

document.getElementById('save').addEventListener('click', function() {
  let keywordValue = document.getElementById('keyword').value; // Get the keyword value from the input
  let keyword = "/" + keywordValue; // Ensure it starts with a slash
  const textBlock = document.getElementById('text').value;

  const obj = {};
  obj[keyword] = textBlock;
  chrome.storage.sync.set(obj, function() {
    if (chrome.runtime.lastError) {
      showMessage('Error saving data: ' + chrome.runtime.lastError.message);
      return;
    }
    showMessage('Keyword updated successfully.');
    loadSavedItems(); // Refresh the list after update
    clearInputFields(); // Clear the top input fields
    toggleAddSaveButtons(); // Switch back to Add mode

    // Ensure the DOM has been updated
    setTimeout(() => {
      const keywordSpan = document.querySelector(`span[data-keyword='${keywordValue}']`);
      if (keywordSpan) {
        const yPosition = keywordSpan.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: yPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Small timeout to wait for the DOM update
  });
});



function toggleAddSaveButtons() {
  const addButton = document.getElementById('add');
  const saveButton = document.getElementById('save');

  if (addButton.style.display === 'none') {
    addButton.style.display = 'inline';
    saveButton.style.display = 'none';
  } else {
    addButton.style.display = 'none';
    saveButton.style.display = 'inline';
  }
}

function showMessage(msg) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
  setTimeout(function() {
    messageDiv.textContent = '';
  }, 3000);
}

function clearInputFields() {
  document.getElementById('keyword').value = '';
  document.getElementById('text').value = '';
}

// Initial state: Show Add button, hide Save button
document.getElementById('save').style.display = 'none';

// Call the function to load items when popup is opened
loadSavedItems();
