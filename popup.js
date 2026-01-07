document.addEventListener('DOMContentLoaded', async () => {
  // Get the active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = tabs[0];

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    enabled: true,
    warningTime: 15,
    confidenceThreshold: 0.4
  });

  // Set initial values
  document.getElementById('enableWarning').checked = settings.enabled;
  document.getElementById('warningTime').value = settings.warningTime;
  document.getElementById('confidenceThreshold').value = settings.confidenceThreshold;

  // Add event listeners
  document.getElementById('enableWarning').addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ enabled });
    chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_WARNING', enabled });
  });

  document.getElementById('warningTime').addEventListener('change', async (e) => {
    const warningTime = parseInt(e.target.value);
    await chrome.storage.sync.set({ warningTime });
    chrome.tabs.sendMessage(activeTab.id, { type: 'UPDATE_SETTINGS', warningTime });
  });

  document.getElementById('confidenceThreshold').addEventListener('change', async (e) => {
    const confidenceThreshold = parseFloat(e.target.value);
    await chrome.storage.sync.set({ confidenceThreshold });
    chrome.tabs.sendMessage(activeTab.id, { type: 'UPDATE_SETTINGS', confidenceThreshold });
  });
}); 