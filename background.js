chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    handleCapture(message.tabId)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async response
  }
});

async function handleCapture(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({ width: window.innerWidth, height: window.innerHeight })
  });

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 100
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `webgrab-${result.width}x${result.height}-${timestamp}.png`;

  await chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  });

  return { success: true };
}
