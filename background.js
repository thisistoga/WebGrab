chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    handleCapture(message.tabId, message.scale)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message.action === 'downscaleResult') {
    // Received from offscreen document
    return false;
  }
});

async function handleCapture(tabId, scale) {
  let dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 100
  });

  // Get actual pixel dimensions from the captured image
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);
  const capturedWidth = bitmap.width;
  const capturedHeight = bitmap.height;
  bitmap.close();

  let outputWidth, outputHeight;

  if (scale === 1) {
    outputWidth = Math.round(capturedWidth / 2);
    outputHeight = Math.round(capturedHeight / 2);
  } else {
    outputWidth = capturedWidth;
    outputHeight = capturedHeight;
  }

  // Always pass through canvas to normalize color space (fixes
  // desaturated colors on wide-gamut displays for raw captures)
  await ensureOffscreenDocument();
  const normalizedDataUrl = await chrome.runtime.sendMessage({
    action: 'downscale',
    dataUrl,
    targetWidth: outputWidth,
    targetHeight: outputHeight
  });
  dataUrl = normalizedDataUrl;
  await chrome.offscreen.closeDocument();

  const tab = await chrome.tabs.get(tabId);
  const domain = new URL(tab.url).hostname.replace(/^www\./, '').replace(/\./g, '_');
  const date = new Date().toISOString().slice(0, 10);
  const filename = `webgrab-${domain}-${outputWidth}x${outputHeight}-${date}.png`;

  await chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  });

  return { success: true };
}

async function ensureOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['BLOBS'],
      justification: 'Downscale screenshot to 1x resolution'
    });
  }
}
