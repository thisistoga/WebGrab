const captureBtn = document.getElementById('capture');
const status = document.getElementById('status');

captureBtn.addEventListener('click', async () => {
  captureBtn.disabled = true;
  status.textContent = 'Capturing…';
  status.className = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found');

    const scale = parseInt(document.querySelector('input[name="scale"]:checked').value, 10);
    const response = await chrome.runtime.sendMessage({ action: 'captureScreenshot', tabId: tab.id, scale });

    if (response && response.success) {
      status.textContent = 'Screenshot saved!';
    } else {
      throw new Error(response?.error || 'Capture failed');
    }
  } catch (err) {
    status.textContent = err.message;
    status.className = 'error';
  } finally {
    captureBtn.disabled = false;
  }
});
