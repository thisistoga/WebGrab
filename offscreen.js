chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downscale') {
    downscale(message.dataUrl, message.targetWidth, message.targetHeight)
      .then(result => sendResponse(result))
      .catch(err => sendResponse(null));
    return true;
  }
});

async function downscale(dataUrl, targetWidth, targetHeight) {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/png');
}
