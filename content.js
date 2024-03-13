console.log('content.js has been loaded.');

document.addEventListener('input', function(e) {
  const target = e.target;
  
  console.log('Input event detected on:', target);
  console.log('Tag name of the target:', target.tagName.toLowerCase());
  console.log('Is contentEditable:', target.contentEditable);

  if (target.tagName.toLowerCase() === 'input' || 
      target.tagName.toLowerCase() === 'textarea' || 
      target.contentEditable === "true") {
      console.log("Target is an input, textarea, or a contentEditable element.");
      
      // Requesting items from the background script
      chrome.runtime.sendMessage({action: "fetchItems"}, function(response) {
        console.log("Fetched items from storage:", response.items);
        
        let items = response.items;
        for (let keyword in items) {
            console.log(`Checking target value: "${target.value}" for keyword: "${keyword}"`);

            if (target.value && target.value.includes(keyword)) {
                console.log(`Attempting to replace keyword ${keyword} with ${items[keyword]}`);
                target.value = target.value.replace(keyword, items[keyword]);
                
                console.log(`Post-replacement value: "${target.value}"`);
            }
        }
      });
  }
});
