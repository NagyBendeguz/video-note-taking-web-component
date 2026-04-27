// page-replacer.js

// Wait for custom element to be defined (or proceed anyway).
function whenDefined(name, timeout = 3000) {
  return new Promise((resolve) => {
    if (window.customElements && window.customElements.get(name)) return resolve();
    const timer = setTimeout(resolve, timeout);
    window.customElements?.whenDefined?.(name).then(() => {
      clearTimeout(timer);
      resolve();
    }).catch(() => clearTimeout(timer));
  });
}

// Replacement logic (keep original hidden and proxy).
const PROXY_PROPS = ['src','currentSrc','currentTime','duration','paused','ended','readyState','volume','muted','playbackRate','loop','controls','crossOrigin','videoWidth','videoHeight'];
const PROXY_METHODS = ['play','pause','load','canPlayType','setAttribute','removeAttribute'];
const FORWARD_EVENTS = ['play','playing','pause','timeupdate','seeking','seeked','ended','volumechange','ratechange','loadedmetadata','loadeddata','waiting','error'];

function copyAttributes(video, vp) {
  const src = video.currentSrc || video.getAttribute('src') || video.querySelector('source')?.src || '';
  if (src) vp.setAttribute('src', src);
  const track = video.querySelector('track[kind="subtitles"], track[kind="captions"], track');
  if (track?.src) vp.setAttribute('subtitle', track.src);
  if (video.lang) vp.setAttribute('lang', video.lang);
  if (video.hasAttribute('controls')) vp.setAttribute('controls', '');
  if (video.muted) vp.setAttribute('muted', '');
  if (video.getAttribute('width')) vp.setAttribute('width', video.getAttribute('width'));
  if (video.getAttribute('height')) vp.setAttribute('height', video.getAttribute('height'));
  vp.className = video.className || '';
  vp.style.cssText = video.style.cssText || '';
}

function createPropertyProxy(orig, vp, prop) {
  try {
    Object.defineProperty(orig, prop, {
      configurable: true,
      enumerable: true,
      get() { try { return vp[prop]; } catch { return undefined; } },
      set(val) { try { vp[prop] = val; } catch {} }
    });
  } catch {}
}

function createMethodProxy(orig, vp, name) {
  if (typeof vp[name] !== 'function') return;
  orig[name] = function(...args) { return vp[name](...args); };
}

function forwardEvents(orig, vp) {
  const handlers = [];
  FORWARD_EVENTS.forEach(ev => {
    const h = (e) => {
      try {
        const evt = new e.constructor(e.type, e);
        orig.dispatchEvent(evt);
      } catch {
        orig.dispatchEvent(new Event(ev));
      }
    };
    vp.addEventListener(ev, h);
    handlers.push(() => vp.removeEventListener(ev, h));
  });
  return () => handlers.forEach(fn => fn());
}

function replacePreserveReference(video) {
  if (!video || video.dataset.__vpReplaced) return;

  // Pause original video to stop autoplay.
  video.pause();

  // Create custom video-player element.
  const vp = document.createElement('video-player');
  copyAttributes(video, vp);

  // Compute sizing strategy:
  // Prefer attributes/inline size on original; otherwise make vp fill the original element's box.
  try {
    const cs = getComputedStyle(video);
    // Copy display (inline/block/flex) so layout matches.
    vp.style.display = cs.display === 'inline' ? 'inline-block' : cs.display || 'block';

    // If original had explicit width/height attributes, preserve them on vp.
    const wAttr = video.getAttribute('width');
    const hAttr = video.getAttribute('height');

    if (wAttr) vp.setAttribute('width', wAttr);
    if (hAttr) vp.setAttribute('height', hAttr);

    // Make the vp fill the original's content box by default.
    // Use width/height 100% so it fills the original element's available area.
    vp.style.boxSizing = cs.boxSizing || 'border-box';
    vp.style.width = wAttr ? '' : '100%';
    vp.style.height = hAttr ? '' : '100%';
    vp.style.maxWidth = '100%';
    vp.style.maxHeight = '100%';
    // Preserve original classes and inline style as fallback.
    vp.className = video.className || '';
  } catch (e) { /* ignore sizing errors */ }

  // Insert vp after original, keep original in DOM to preserve references.
  video.parentNode?.insertBefore(vp, video.nextSibling);

  // Hide original video with display: none
  // and pointer-events: none so it doesn't capture input.
  video.style.display = 'none';
  video.style.pointerEvents = 'none';
  video.dataset.__vpReplaced = '1';

  // Ensure parent/container allows the vp to fill the area:
  // If the original element has an intrinsic size (not controlled by parent),
  // set the parent's min-inline size to original's size to avoid collapse.
  try {
    const parent = video.parentElement;
    if (parent) {
      const vr = video.getBoundingClientRect();
      // Apply fallback min sizes only if parent would otherwise collapse.
      if (parent.clientWidth < 2) parent.style.minWidth = (vr.width || video.offsetWidth) + 'px';
      if (parent.clientHeight < 2) parent.style.minHeight = (vr.height || video.offsetHeight) + 'px';
    }
  } catch (e) {}

  // Wait for custom element to be defined and then sync state + force layout.
  whenDefined('video-player').then(() => {
    try {
      // Set host-scoped CSS var so the component uses it (safer for multiple videos).
      vp.style.setProperty('--video-height', 'calc(100vh - 75px)');
      // Also set explicit host height so layout matches immediately.
      vp.style.height = 'calc(100vh - 75px)';
      // Ensure width fills the original element's area.
      if (!vp.style.width) vp.style.width = '100%';
      // Ensure box sizing prevents collapse.
      vp.style.boxSizing = 'border-box';

      // Trigger one resize-like event so component re-measures once.
      void vp.offsetHeight;
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(() => void vp.getBoundingClientRect());
    
      // Restore playback state.
      if (video.hasAttribute('autoplay')) vp.setAttribute('autoplay', '');
      if (video.muted) vp.setAttribute('muted', '');
      if (typeof vp.currentTime === 'number' && typeof video.currentTime === 'number') {
        try { vp.currentTime = video.currentTime; } catch {}
      }
      if (!video.paused && typeof vp.play === 'function') {
        vp.play?.().catch(()=>{ /* autoplay blocked */ });
      }
    } catch (e) { /* ignore */ }

    // Proxy properties/methods & forward events (same as before).
    PROXY_PROPS.forEach(p => createPropertyProxy(video, vp, p));
    PROXY_METHODS.forEach(m => createMethodProxy(video, vp, m));

    const origAdd = video.addEventListener.bind(video);
    const origRemove = video.removeEventListener.bind(video);
    video.addEventListener = function(type, listener, options) { origAdd(type, listener, options); };
    video.removeEventListener = function(type, listener, options) { origRemove(type, listener, options); };

    const cleanup = forwardEvents(video, vp);

    // Cleanup if original is removed.
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const n of m.removedNodes) {
          if (n === video) {
            cleanup();
            mo.disconnect();
            vp.remove();
            return;
          }
        }
      }
    });
    mo.observe(video.parentNode || document.body, { childList: true });
  }).catch(()=>{});
}

function replaceAllVideos() {
  document.querySelectorAll('video').forEach(replacePreserveReference);
}

const observer = new MutationObserver(mutations => {
  for (const m of mutations) {
    for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.tagName === 'VIDEO') replacePreserveReference(n);
      n.querySelectorAll?.('video')?.forEach(replacePreserveReference);
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    replaceAllVideos();
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }, { once: true });
} else {
  replaceAllVideos();
  observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
}
