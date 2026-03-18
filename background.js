chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    handleCapture(message.tabId, message.scale)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async response
  }
});

async function handleCapture(tabId, scale) {
  const [{ result: tabInfo }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio
    })
  });

  let dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 100
  });

  // The captured image is always at native (dpr) resolution.
  // For 1x, scale it down to match the CSS viewport dimensions.
  const nativeWidth = tabInfo.width * tabInfo.dpr;
  const nativeHeight = tabInfo.height * tabInfo.dpr;
  let outputWidth, outputHeight;

  if (scale === 1) {
    outputWidth = tabInfo.width;
    outputHeight = tabInfo.height;
    dataUrl = await downscale(dataUrl, outputWidth, outputHeight);
  } else {
    outputWidth = nativeWidth;
    outputHeight = nativeHeight;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `webgrab-${outputWidth}x${outputHeight}-${timestamp}.png`;

  await chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  });

  return { success: true };
}

async function downscale(dataUrl, targetWidth, targetHeight) {
  // Service workers don't have DOM, so use OffscreenCanvas
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const outBlob = await canvas.convertToBlob({ type: 'image/png' });
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(outBlob);
  });
}
