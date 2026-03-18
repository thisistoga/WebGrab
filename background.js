chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreenshot') {
    handleCapture(message.tabId, message.scale)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // keep message channel open for async response
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

  let outputWidth, outputHeight;

  if (scale === 1) {
    // Native capture is at 2x on retina — halve it for 1x
    outputWidth = Math.round(capturedWidth / 2);
    outputHeight = Math.round(capturedHeight / 2);

    const canvas = new OffscreenCanvas(outputWidth, outputHeight);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
    bitmap.close();

    const outBlob = await canvas.convertToBlob({ type: 'image/png' });
    dataUrl = await blobToDataUrl(outBlob);
  } else {
    outputWidth = capturedWidth;
    outputHeight = capturedHeight;
    bitmap.close();
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

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}
