// content-inject.js

(function() {
  const pageScriptUrl = chrome.runtime.getURL('page-replacer.js');
  const moduleUrl = chrome.runtime.getURL('main-IJ76T4K7.js');
  const styleUrl = chrome.runtime.getURL('styles-5VODSUGZ.css');

  // 1) Inject stylesheet into page.
  if (!document.querySelector('link[data-ext-video-player]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleUrl;
    link.setAttribute('data-ext-video-player', '1');
    document.head?.appendChild(link);
  }

  // 2) Inject Angular Elements entry as module script into page.
  if (!window.customElements?.get?.('video-player')) {
    const mod = document.createElement('script');
    mod.type = 'module';
    mod.src = moduleUrl;
    mod.async = false;
    document.head?.appendChild(mod);
    // keep script node (do not remove)
  }

  // 3) Inject page-replacer.js (page-context script with no chrome.* usage).
  // Use external file so it runs in page context (must be listed in web_accessible_resources).
  const s = document.createElement('script');
  s.src = pageScriptUrl;
  s.type = 'text/javascript';
  s.async = false;
  (document.head || document.documentElement).appendChild(s);
  s.onload = () => { /* optional cleanup if desired */ };
})();
