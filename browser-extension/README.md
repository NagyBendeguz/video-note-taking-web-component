# Video note-taking browser extension

## Warning!

This is a demo browser extension and only works for default HTML video elements.

For example where it works:
- On localhost: http://127.0.0.1:5500/video.mp4
- Video element: https://77b361c202cf7d3dd510f86bc3000fa3f282bc61.mdnplay.dev/shared-assets/videos/sintel-short.webm

## Usage

Rename one of the manifest files to `manifest.json` depending on which browser you use. So if you use gecko based browser rename manifest_gecko.json to manifest.json, if you use chromium based browser rename manifest_chromium.json to manifest.json.

**Chromium**
- Settings -> Extensions -> Manage Extensions
- Here turn on: Developer mode
- Click: Load unpacked
- Select the browser-extension folder

**Gecko**
- Type this into the URL: about:debugging
- Here click on the left: This Firefox
- Now click: Load Temporary Add-on...
- Select the manifest.json file

Allow required permissions to work.

It is using the output of the Angular Elements project that are not committed. Copy it from the video-note-taking-web-component/dist/video-note-taking-web-component/browser/ folder (all JS, CSS files and the assets and media folders). Also check that the names match those in the manifest.json files.
