import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { VideoPlayer } from './video-player';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from '../../test-utils/mock-translate.service';

class MockVideoService {
  togglePlay = new Subject<void>();
  rewind = new Subject<number>();
  forward = new Subject<number>();
  isPlaying$ = new BehaviorSubject<boolean>(false);
  timestamp$ = new BehaviorSubject<string>('00:00:00.000');
  jumpToTimestamp = new Subject<void>();
  volume$ = new Subject<number>();
  fullscreenRequest$ = new Subject<boolean>();
  setPlaying = jasmine.createSpy('setPlaying');
  setDuration = jasmine.createSpy('setDuration');
  setCurrentTime = jasmine.createSpy('setCurrentTime');
  setThumbnail = jasmine.createSpy('setThumbnail');
  setFullscreen = jasmine.createSpy('setFullscreen');
  getNote() { return new BehaviorSubject<boolean>(false).asObservable(); }
  isNote$ = new BehaviorSubject<boolean>(false);
  getSettings() { return new BehaviorSubject<boolean>(false).asObservable(); }
  isSettings$ = new BehaviorSubject<boolean>(false);
}

class MockSettingsService {
  playbackRate$ = new BehaviorSubject<number>(1);
  isVisible$ = new BehaviorSubject<boolean>(false);
  videoNavbarOffset$ = new BehaviorSubject<boolean>(false);
  settings$ = new BehaviorSubject<any>({ thumbnailWidth: 120, thumbnailHeight: 90, thumbnailQualityPercentage: 80 });
  toggleVideoNavbarOffset = jasmine.createSpy('toggleVideoNavbarOffset');
  updateThumbnailWidth = jasmine.createSpy('updateThumbnailWidth');
  updateThumbnailHeight = jasmine.createSpy('updateThumbnailHeight');
}

describe('VideoPlayer', () => {
  let component: VideoPlayer;
  let fixture: ComponentFixture<VideoPlayer>;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;
  let mockVideoService: MockVideoService;
  let mockSettings: MockSettingsService;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });
    mockVideoService = new MockVideoService();
    mockSettings = new MockSettingsService();

    await TestBed.configureTestingModule({
      declarations: [VideoPlayer],
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: TranslateService, useValue: mockTranslate }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoPlayer);
    component = fixture.componentInstance;

    (component as any).videoService = mockVideoService;
    (component as any).settingsService = mockSettings;
    (component as any).translate = new MockTranslateService();

    component.isNote$ = mockVideoService.getNote();
    component.isSettings$ = mockVideoService.getSettings();

    const videoEl = document.createElement('video') as any;
    let _paused = true;
    let _currentTime = 10;
    let _duration = 100;
    let _videoWidth = 640;
    let _videoHeight = 360;

    Object.defineProperty(videoEl, 'paused', { get: () => _paused, configurable: true });
    Object.defineProperty(videoEl, 'currentTime', { get: () => _currentTime, set: (v: number) => { _currentTime = v; }, configurable: true });
    Object.defineProperty(videoEl, 'duration', { get: () => _duration, configurable: true });
    Object.defineProperty(videoEl, 'videoWidth', { get: () => _videoWidth, configurable: true });
    Object.defineProperty(videoEl, 'videoHeight', { get: () => _videoHeight, configurable: true });

    const playSpy = spyOn(videoEl, 'play').and.callFake(() => { _paused = false; return Promise.resolve(); });
    const pauseSpy = spyOn(videoEl, 'pause').and.callFake(() => { _paused = true; });

    const trackEl = document.createElement('track') as any;
    Object.defineProperty(trackEl, 'track', { value: { mode: 'hidden' }, writable: true });

    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d')!;
    spyOn(ctx, 'drawImage').and.callThrough();

    component.videoElement = { nativeElement: videoEl } as any;
    component.subtitlesTrack = { nativeElement: trackEl } as any;
    component.canvasElement = { nativeElement: canvasEl } as any;
    component.videoPlayerDiv = { nativeElement: document.createElement('div') } as any;

    (component as any).pica = {
      resize: jasmine.createSpy('resize').and.callFake((inCanvas: HTMLCanvasElement, outCanvas: HTMLCanvasElement) => {
        outCanvas.width = inCanvas.width;
        outCanvas.height = inCanvas.height;
        return Promise.resolve(outCanvas);
      }),
      toBlob: jasmine.createSpy('toBlob').and.callFake((outCanvas: HTMLCanvasElement, type: string, quality: number) => {
        const blob = new Blob(['fake'], { type: 'image/jpeg' });
        return Promise.resolve(blob);
      })
    };

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  /*it('togglePlay should play when paused and call videoService.setPlaying(true)', () => {
    const v = component.videoElement.nativeElement as any;
    // ensure paused true initially (getter default)
    component.togglePlay();
    expect((v.play as jasmine.Spy)).toHaveBeenCalled();
    expect((component as any).videoService.setPlaying).toHaveBeenCalledWith(true);
  });*/

  /*it('togglePlay should pause when playing and call videoService.setPlaying(false)', () => {
    const v = component.videoElement.nativeElement as any;
    // switch to playing state by invoking play spy
    (v.play as jasmine.Spy).and.callFake(() => { *//* already handled but ensure it exists *//* });
    (v.play as jasmine.Spy)(); // set internal paused flag to false via spy implementation
    component.togglePlay();
    expect((v.pause as jasmine.Spy)).toHaveBeenCalled();
    expect((component as any).videoService.setPlaying).toHaveBeenCalledWith(false);
  });*/

  /*it('setPlay(true) calls play, setPlay(false) calls pause', () => {
    const v = component.videoElement.nativeElement as any;
    component.setPlay(true);
    expect((v.play as jasmine.Spy)).toHaveBeenCalled();
    component.setPlay(false);
    expect((v.pause as jasmine.Spy)).toHaveBeenCalled();
  });*/

  it('rewind should decrease currentTime but not below 0', () => {
    const v = component.videoElement.nativeElement as any;
    v.currentTime = 5;
    component.rewind(3);
    expect(v.currentTime).toBe(2);
    component.rewind(10);
    expect(v.currentTime).toBe(0);
  });

  /*it('forward should increase currentTime and pause at duration and call setPlaying(false)', () => {
    const v = component.videoElement.nativeElement as any;
    v.currentTime = 95;
    // ensure pause spy exists
    expect((v.pause as jasmine.Spy)).toBeDefined();
    component.forward(10);
    expect(v.currentTime).toBe(100);
    expect((v.pause as jasmine.Spy)).toHaveBeenCalled();
    expect((component as any).videoService.setPlaying).toHaveBeenCalledWith(false);
  });*/

  it('changeVolume adjusts video.volume', () => {
    const v = component.videoElement.nativeElement as any;
    component.changeVolume(50);
    expect(v.volume).toBeCloseTo(0.5, 5);
    component.changeVolume();
    expect(v.volume).toBeCloseTo(1, 5);
  });

  it('setCurrentTime calls videoService.setCurrentTime and creates thumbnail when isNote true', () => {
    const v = component.videoElement.nativeElement as any;
    v.currentTime = 42;
    (component as any).isNote = true;
    spyOn<any>(component, 'createCurrentThumbnail').and.callThrough();
    component.setCurrentTime();
    expect((component as any).videoService.setCurrentTime).toHaveBeenCalledWith(42);
    expect((component as any).createCurrentThumbnail).toHaveBeenCalled();
  });

  it('setVideoTimeByClick sets video.currentTime from event', () => {
    const v = component.videoElement.nativeElement as any;
    component.setVideoTimeByClick(new CustomEvent('setVideoTime', { detail: 77 }));
    expect(v.currentTime).toBe(77);
  });

  it('jumpToTimestamp computes seconds and sets currentTime', () => {
    const v = component.videoElement.nativeElement as any;
    (component as any).timestamp = '01:02:03.500';
    component['jumpToTimestamp']();
    expect(v.currentTime).toBeCloseTo(3723.5, 3);
  });

  it('setVideoSubtitleVisibility sets track.track.mode', () => {
    const track = component.subtitlesTrack.nativeElement as any;
    component['setVideoSubtitleVisibility'](true);
    expect(track.track.mode).toBe('showing');
    component['setVideoSubtitleVisibility'](false);
    expect(track.track.mode).toBe('hidden');
  });

  it('getLanguageLabel returns a string', () => {
    const label = component.getLanguageLabel('fr');
    expect(typeof label).toBe('string');
  });

  it('onVideoMetadataLoaded sets duration, video height and thumbnail settings', () => {
    spyOn<any>(component, 'setDuration').and.callThrough();
    spyOn<any>(component, 'setVideoHeight').and.callThrough();
    spyOn<any>(component, 'setThumbnailSettings').and.callThrough();
    component.onVideoMetadataLoaded();
    expect((component as any).setDuration).toHaveBeenCalled();
    expect((component as any).setVideoHeight).toHaveBeenCalled();
    expect((component as any).setThumbnailSettings).toHaveBeenCalled();
  });

  /*it('createCurrentThumbnail draws on canvas and triggers pica.resize', () => {
    component['createCurrentThumbnail']();
    tick();
    expect((component as any).pica.resize).toHaveBeenCalled();
    expect((component as any).pica.toBlob).toHaveBeenCalled();
  });*/
});
