import { ChangeDetectorRef } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { VideoPlayer } from './video-player';

function mockVideoService() {
  return {
    togglePlay: new Subject<void>(),
    rewind: new Subject<number>(),
    forward: new Subject<number>(),
    isPlaying$: new BehaviorSubject<boolean>(false),
    timestamp$: new Subject<string>(),
    jumpToTimestamp: new Subject<void>(),
    volume$: new Subject<number>(),
    time$: new Subject<number>(),
    getNote: () => new BehaviorSubject<boolean>(false),
    isNote$: new BehaviorSubject<boolean>(false),
    getSettings: () => new BehaviorSubject<boolean>(false),
    isSettings$: new BehaviorSubject<boolean>(false),
    fullscreenRequest$: new Subject<boolean>(),
    setPlaying: jasmine.createSpy('setPlaying'),
    setDuration: jasmine.createSpy('setDuration'),
    setCurrentTime: jasmine.createSpy('setCurrentTime'),
    setIsActive: jasmine.createSpy('setIsActive'),
    setFullscreen: jasmine.createSpy('setFullscreen'),
    setThumbnail: jasmine.createSpy('setThumbnail'),
  };
}

function mockSettingsService() {
  return {
    playbackRate$: new Subject<number>(),
    isVisible$: new Subject<boolean>(),
    videoNavbarOffset$: new BehaviorSubject<boolean>(false),
    settings$: new BehaviorSubject<any>({ theme: 'default' }),
    offsetChanges: new Subject<string>(),
    updateThumbnailWidth: jasmine.createSpy('updateThumbnailWidth'),
    updateThumbnailHeight: jasmine.createSpy('updateThumbnailHeight'),
    toggleVideoNavbarOffset: jasmine.createSpy('toggleVideoNavbarOffset'),
  };
}

function createNativeElementWithShadow() {
  const host = document.createElement('div');
  const sr = host.attachShadow({ mode: 'open' });

  const video = document.createElement('video') as HTMLVideoElement;
  Object.defineProperty(video, 'duration', { value: 120, writable: true });
  Object.defineProperty(video, 'videoWidth', { value: 640, writable: true });
  Object.defineProperty(video, 'videoHeight', { value: 360, writable: true });
  Object.defineProperty(video, 'clientHeight', { value: 200, writable: true });
  video.currentTime = 0;
  (video as any).play = jasmine.createSpy('play');
  (video as any).pause = jasmine.createSpy('pause');

  sr.appendChild(video);

  const track = document.createElement('track') as HTMLTrackElement;
  Object.defineProperty(track, 'track', {
    configurable: true,
    get: () => ({ mode: 'hidden' })
  });

  const canvas = document.createElement('canvas');

  return { host, shadowRoot: sr, video, track, canvas };
}

describe('VideoPlayer (unit)', () => {
  let component: VideoPlayer;
  let native: ReturnType<typeof createNativeElementWithShadow>;
  let videoService: any;
  let settingsService: any;
  let cdr: Partial<ChangeDetectorRef>;

  beforeEach(() => {
    videoService = mockVideoService();
    settingsService = mockSettingsService();
    cdr = { detectChanges: () => {} };

    native = createNativeElementWithShadow();

    const elRef = { nativeElement: native.host } as any;
    component = new VideoPlayer(elRef, cdr as ChangeDetectorRef, videoService, settingsService, { use: () => {}, instant: (): any => {} } as any);

    component.videoPlayerDiv = { nativeElement: native.host } as any;
    component.subtitlesTrack = { nativeElement: native.track } as any;
    component.canvasElement = { nativeElement: native.canvas } as any;

    spyOn(native.host.style, 'setProperty');
    (native.host as any).requestFullscreen = jasmine.createSpy('requestFullscreen');
    (document as any).exitFullscreen = jasmine.createSpy('exitFullscreen');
    (document as any).fullscreenElement = null;
  });

  it('should update src, subtitle, lang via ngOnChanges and set video props when previousValue exists', () => {
    const changes: any = {
      src: { currentValue: 'http://test/video.mp4', previousValue: 'old.mp4', firstChange: false, isFirstChange: () => false },
      subtitle: { currentValue: 'sub.vtt', previousValue: 'old.vtt', firstChange: false, isFirstChange: () => false },
      lang: { currentValue: 'fr', previousValue: 'en', firstChange: false, isFirstChange: () => false },
    };

    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    component.ngOnChanges(changes);

    expect(videoEl.src).toContain('http://test/video.mp4');
    expect(videoEl.crossOrigin).toBe('anonymous');
    expect(native.track.lang).toBe('fr');
    expect(native.track.label).toBeTruthy();
  });

  it('setPlay plays or pauses the video depending on boolean', () => {
    const videoEl = native.shadowRoot.querySelector('video') as any;
    component.setPlay(true);
    expect(videoEl.play).toHaveBeenCalled();
    component.setPlay(false);
    expect(videoEl.pause).toHaveBeenCalled();
  });

  it('togglePlay toggles and calls videoService.setPlaying', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;

    Object.defineProperty(videoEl, 'paused', { configurable: true, get: () => true });
    component.togglePlay();
    expect(videoEl.play).toHaveBeenCalled();
    expect(videoService.setPlaying).toHaveBeenCalledWith(true);

    Object.defineProperty(videoEl, 'paused', { configurable: true, get: () => false });
    component.togglePlay();
    expect(videoEl.pause).toHaveBeenCalled();
    expect(videoService.setPlaying).toHaveBeenCalledWith(false);
  });

  it('rewind does not go below 0', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    videoEl.currentTime = 1;
    component.rewind(5);
    expect(videoEl.currentTime).toBe(0);
  });

  it('forward does not exceed duration and pauses at end', () => {
    const videoEl = native.shadowRoot.querySelector('video') as any;
    videoEl.currentTime = 110;
    videoEl.duration = 120;
    component.forward(15);
    expect(videoEl.currentTime).toBe(120);
    expect(videoEl.pause).toHaveBeenCalled();
    expect(videoService.setPlaying).toHaveBeenCalledWith(false);
  });

  it('changeVolume sets volume correctly', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    component.changeVolume(50);
    expect(videoEl.volume).toBe(0.5);
  });

  it('onVideoMetadataLoaded calls setDuration, setVideoHeight, setThumbnailSettings', () => {
    spyOn(component as any, 'setDuration');
    spyOn(component as any, 'setVideoHeight');
    spyOn(component as any, 'setThumbnailSettings');
    component.onVideoMetadataLoaded();
    expect((component as any).setDuration).toHaveBeenCalled();
    expect((component as any).setVideoHeight).toHaveBeenCalled();
    expect((component as any).setThumbnailSettings).toHaveBeenCalled();
  });

  it('setDuration delegates to videoService.setDuration', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    (videoEl as any).duration = 77;
    component.setDuration();
    expect(videoService.setDuration).toHaveBeenCalledWith(77);
  });

  it('setCurrentTime delegates and creates thumbnail if isNote', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    videoEl.currentTime = 12.34;
    component.isNote = true;
    spyOn(component as any, 'createCurrentThumbnail');
    component.setCurrentTime();
    expect(videoService.setCurrentTime).toHaveBeenCalledWith(12.34);
    expect((component as any).createCurrentThumbnail).toHaveBeenCalled();
  });

  it('setVideoTimeByClick changes video currentTime', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    component.setVideoTimeByClick(42);
    expect(videoEl.currentTime).toBe(42);
  });

  it('setFullscreen requests fullscreen when requested and toggles navbar offset via service', () => {
    (component as any).isVideoNavbarOffset = true;
    component.setFullscreen(true);
    expect(native.host.requestFullscreen).toHaveBeenCalled();
    expect(settingsService.toggleVideoNavbarOffset).toHaveBeenCalled();
  });

  it('activate adds pointerdown listener and sets service active', () => {
    spyOn(document, 'addEventListener');
    component.activate();
    expect(videoService.setIsActive).toHaveBeenCalledWith(true);
    expect(document.addEventListener).toHaveBeenCalledWith('pointerdown', jasmine.any(Function), { capture: true });
  });

  it('deactivate removes pointerdown listener and sets service inactive', () => {
    spyOn(document, 'removeEventListener');
    component.deactivate();
    expect(videoService.setIsActive).toHaveBeenCalledWith(false);
    expect(document.removeEventListener).toHaveBeenCalledWith('pointerdown', jasmine.any(Function), { capture: true });
  });

  it('onGlobalPointer deactivates when click outside host', () => {
    spyOn(component, 'deactivate' as any);
    const fakeEvent = {
      composedPath: () => [document.createElement('div')],
      target: document.createElement('div'),
    } as any;
    (component as any).onGlobalPointer(fakeEvent);
    expect((component as any).deactivate).toHaveBeenCalled();
  });

  it('applyThemeToHost replaces existing theme classes and adds new one', () => {
    const host = native.host;
    host.classList.add('theme-old', 'other');
    (component as any).applyThemeToHost('newtheme');
    expect(host.classList.contains('theme-old')).toBeFalse();
    expect(host.classList.contains('theme-newtheme')).toBeTrue();
  });

  it('getLanguageLabel returns a non-empty label for valid lang and handles errors', () => {
    const label = (component as any).getLanguageLabel('en');
    expect(typeof label).toBe('string');

    spyOn((Intl as any), 'DisplayNames').and.callFake(() => { throw new Error('fail'); });
    const label2 = (component as any).getLanguageLabel('xx');
    expect(label2).toBe('Unknown Language');
  });

  it('jumpToTimestamp parses timestamp and sets video currentTime', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    (component as any).timestamp = '01:02:03.500';
    (component as any).jumpToTimestamp();
    expect(videoEl.currentTime).toBeCloseTo(3723.5, 3);
  });

  it('setVideoPlaybackRate sets the playbackRate on video', () => {
    const videoEl = native.shadowRoot.querySelector('video') as any;
    (component as any).setVideoPlaybackRate(1.5);
    expect(videoEl.playbackRate).toBe(1.5);
  });

  it('setThumbnailSettings calls settingsService update for width and height', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(videoEl, 'videoWidth', { value: 320, writable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 180, writable: true });
    (component as any).setThumbnailSettings();
    expect(settingsService.updateThumbnailWidth).toHaveBeenCalledWith(320);
    expect(settingsService.updateThumbnailHeight).toHaveBeenCalledWith(180);
  });

  it('onResize calls setVideoHeight (HostListener wiring)', () => {
    spyOn(component as any, 'setVideoHeight');
    component.onResize();
    expect((component as any).setVideoHeight).toHaveBeenCalled();
  });

  it('checkFullscreen listener calls videoService.setFullscreen and toggles navbar offset when leaving fullscreen', () => {
    (component as any).navbarOffsetState = true;
    (component as any).checkFullscreen();

    (document as any).fullscreenElement = {};
    const ev = new Event('fullscreenchange');
    document.dispatchEvent(ev);

    (document as any).fullscreenElement = null;
    document.dispatchEvent(ev);

    expect(videoService.setFullscreen).toHaveBeenCalledWith(false);
    expect(settingsService.toggleVideoNavbarOffset).toHaveBeenCalled();
    expect((component as any).navbarOffsetState).toBeFalse();
  });

  it('setVideoHeight sets --video-height to clientHeight + 5 when not settings/note', () => {
    component.isSettings = false;
    component.isNote = false;
    (component as any).setVideoHeight();
    expect(native.host.style.setProperty).toHaveBeenCalledWith('--video-height', '205px');
  });

  it('setVideoHeight sets --video-height to clientHeight*2 + 5 when settings or note', () => {
    const videoEl = native.shadowRoot.querySelector('video') as HTMLVideoElement;
    component.isSettings = true;
    component.isNote = false;
    (component as any).setVideoHeight();
    expect(native.host.style.setProperty).toHaveBeenCalledWith('--video-height', '405px');

    component.isSettings = false;
    component.isNote = true;
    (component as any).setVideoHeight();
    expect(native.host.style.setProperty).toHaveBeenCalledWith('--video-height', '405px');
  });

  describe('convertBlobToBase64', () => {
    it('converts a small blob to data URL', async () => {
      const blob = new Blob(['hello'], { type: 'text/plain' });
      const result = await (component as any).convertBlobToBase64(blob);
      expect(typeof result).toBe('string');
      expect(result.startsWith('data:')).toBeTrue();
    });
  });
});
