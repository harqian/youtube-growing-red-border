// Listen for both tab updates and navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tabId, {
      type: "NEW"
    }).catch(() => {}); // Ignore errors if content script isn't ready yet
  }
});
