# WebGrab

A lightweight Chrome extension that captures high-resolution screenshots of web pages at their exact page size.

## Features

- **Dual Resolution Capture** — Choose between 1x (standard) and 2x (high-DPI) screenshot modes
- **Automatic Saving** — Screenshots save as PNG files named `webgrab-[width]x[height]-[timestamp].png`
- **No Dependencies** — Pure HTML/CSS/JS with zero external libraries

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/thisistoga/WebGrab.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `WebGrab` folder

## Usage

1. Navigate to the page you want to capture
2. Click the WebGrab extension icon in the toolbar
3. Select your resolution (1x or 2x)
4. Click **Capture Screenshot**
5. The screenshot saves to your downloads folder automatically

## How It Works

WebGrab uses Chrome's `captureVisibleTab` API to capture the active tab. For 2x mode, the capture is saved at native resolution. For 1x mode, an offscreen document with a Canvas element downscales the image to standard resolution before saving.

Built with **Manifest V3** and the offscreen document pattern for reliable image processing in modern Chrome.

## Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Capture the current tab's visible content |
| `downloads` | Save screenshots to the downloads folder |
| `offscreen` | Create a canvas context for image downscaling |

## Project Structure

```
WebGrab/
├── manifest.json       # Extension manifest (MV3)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── background.js       # Service worker — capture & download
├── offscreen.html      # Offscreen document for canvas ops
├── offscreen.js        # Image downscaling logic
└── icons/              # Extension icons (16, 48, 128)
```

## License

MIT
