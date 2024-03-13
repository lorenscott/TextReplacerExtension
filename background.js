chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "fetchItems") {
        chrome.storage.sync.get(null, function(items) {
            sendResponse({items: items});
        });
        return true; // Return true to indicate you wish to send a response asynchronously
    }
});
