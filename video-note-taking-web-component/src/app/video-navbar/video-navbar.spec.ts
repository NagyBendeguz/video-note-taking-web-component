import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoNavbar } from './video-navbar';
import { BehaviorSubject } from 'rxjs';
import { Settings } from '../models/settings';

class VideoServiceMock {
  private playing$ = new BehaviorSubject<boolean>(false);
  private volume$ = new BehaviorSubject<number>(100);
  duration$ = new BehaviorSubject<number>(0);
  private currentTime$ = new BehaviorSubject<number>(0);
  private isNote$ = new BehaviorSubject<boolean>(false);
  private isSettings$ = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = new BehaviorSubject<boolean>(false);

  getPlaying() { return this.playing$.asObservable(); }
  getVolume() { return this.volume$.asObservable(); }
  getDuration() { return this.duration$.asObservable(); }
  getCurrentTime() { return this.currentTime$.asObservable(); }
  getNote() { return this.isNote$.asObservable(); }
  getSettings() { return this.isSettings$.asObservable(); }
  getFullscreen() { return this.fullscreenRequest$.asObservable(); }

  emitTogglePlay = jasmine.createSpy('emitTogglePlay');
  emitRewind = jasmine.createSpy('emitRewind');
  emitForward = jasmine.createSpy('emitForward');
  setVolume = jasmine.createSpy('setVolume');
  setPlaying = jasmine.createSpy('setPlaying');
  setNote = jasmine.createSpy('setNote');
  setSettings = jasmine.createSpy('setSettings');
  setFullscreen = jasmine.createSpy('setFullscreen');

  pushPlaying(v: boolean) { this.playing$.next(v); }
  pushVolume(v: number) { this.volume$.next(v); }
  pushDuration(v: number) { this.duration$.next(v); }
  pushCurrentTime(v: number) { this.currentTime$.next(v); }
  pushIsNote(v: boolean) { this.isNote$.next(v); }
  pushIsSettings(v: boolean) { this.isSettings$.next(v); }
  pushFullscreen(v: boolean) { this.fullscreenRequest$.next(v); }
}

class SettingsServiceMock {
  videoForwardRate$ = new BehaviorSubject<number>(5);
  videoRewindRate$ = new BehaviorSubject<number>(5);
  settings$ = new BehaviorSubject<Settings>({
    stopVideoOnNote: false,
    shortcuts: { note: 'n', settings: 's' },
  } as unknown as Settings);

  pushForwardRate(v: number) { this.videoForwardRate$.next(v); }
  pushRewindRate(v: number) { this.videoRewindRate$.next(v); }
  pushSettings(s: Settings) { this.settings$.next(s); }
}

describe('VideoNavbar', () => {
  let fixture: ComponentFixture<VideoNavbar>;
  let component: VideoNavbar;
  let videoService: VideoServiceMock;
  let settingsService: SettingsServiceMock;

  beforeEach(async () => {
    videoService = new VideoServiceMock();
    settingsService = new SettingsServiceMock();

    await TestBed.configureTestingModule({
      declarations: [VideoNavbar],
      providers: [
        { provide: (VideoNavbar as any).ɵprov ? (VideoNavbar as any).ɵprov : 'VideoService', useValue: null },
        { provide: 'VideoService', useValue: videoService },
        { provide: 'SettingsService', useValue: settingsService },
      ],
      schemas: []
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoNavbar);
    component = fixture.componentInstance;

    (component as any).videoService = videoService as any;
    (component as any).settingsService = settingsService as any;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    try { window.removeEventListener('keydown', (component as any).keyHandler); } catch {}
  });

  it('should create and subscribe to observables', () => {
    expect(component).toBeTruthy();
    expect(component.isPlaying$).toBeDefined();
    expect(component.volumePercentage$).toBeDefined();
    expect(component.duration$).toBeDefined();
    expect(component.currentTime$).toBeDefined();
    expect(component.isNote$).toBeDefined();
    expect(component.isSettings$).toBeDefined();
    expect(component.fullscreenRequest$).toBeDefined();
  });

  it('should update previousVolume only when volume != 0', () => {
    videoService.pushVolume(50);
    expect((component as any).previousVolume).toBe(50);

    videoService.pushVolume(0);
    expect((component as any).previousVolume).toBe(50);

    videoService.pushVolume(20);
    expect((component as any).previousVolume).toBe(20);
  });

  it('onTogglePlay calls videoService.emitTogglePlay', () => {
    component.onTogglePlay();
    expect(videoService.emitTogglePlay).toHaveBeenCalled();
  });

  it('onRewind and onForward call service with configured rates', () => {
    settingsService.pushRewindRate(7);
    settingsService.pushForwardRate(9);
    fixture.detectChanges();

    expect((component as any).videoRewindRate).toBe(7);
    expect((component as any).videoForwardRate).toBe(9);

    component.onRewind();
    expect(videoService.emitRewind).toHaveBeenCalledWith(7);

    component.onForward();
    expect(videoService.emitForward).toHaveBeenCalledWith(9);
  });

  it('setVolume and mute/unMute call setVolume on service with correct values', () => {
    component.setVolume('42');
    expect(videoService.setVolume).toHaveBeenCalledWith(42);

    component.mute();
    expect(videoService.setVolume).toHaveBeenCalledWith(0);

    (component as any).previousVolume = 73;
    component.unMute();
    expect(videoService.setVolume).toHaveBeenCalledWith(73);
  });

  it('setCurrentTimeByClick dispatches setVideoTime with calculated time', () => {
    (component as any).duration = 200;

    const progress = document.createElement('progress') as HTMLProgressElement;
    spyOn(progress, 'getBoundingClientRect').and.returnValue({ left: 100 } as DOMRect);
    Object.defineProperty(progress, 'clientWidth', { get: () => 400 });

    const ev = new MouseEvent('click', { clientX: 400 });
    Object.defineProperty(ev, 'target', { get: () => progress });

    const spyDispatch = spyOn(document, 'dispatchEvent');
    (component as any).duration = 200;
    component.setCurrentTimeByClick(ev as any);
    expect(spyDispatch).toHaveBeenCalled();
    const dispatched = spyDispatch.calls.mostRecent().args[0] as CustomEvent;
    expect(dispatched.type).toBe('setVideoTime');
    expect(dispatched.detail).toBeCloseTo(150, 6);
  });

  it('toggleNotePage toggles note and respects stopVideoOnNote setting', () => {
    (component as any).isSettings = false;
    (component as any).isNote = false;
    settingsService.pushSettings({ stopVideoOnNote: true, shortcuts: { note: 'n', settings: 's' } } as unknown as Settings);
    fixture.detectChanges();

    component.toggleNotePage();
    expect(videoService.setNote).toHaveBeenCalledWith(true);
    expect(videoService.setPlaying).toHaveBeenCalledWith(false);

    (component as any).isNote = true;
    component.toggleNotePage();
    expect(videoService.setNote).toHaveBeenCalledWith(false);
  });

  it('toggleSettingsPage toggles settings and respects stopVideoOnNote setting', () => {
    (component as any).isNote = false;
    (component as any).isSettings = false;
    settingsService.pushSettings({ stopVideoOnNote: true, shortcuts: { note: 'n', settings: 's' } } as unknown as Settings);
    fixture.detectChanges();

    component.toggleSettingsPage();
    expect(videoService.setSettings).toHaveBeenCalledWith(true);
    expect(videoService.setPlaying).toHaveBeenCalledWith(false);

    (component as any).isSettings = true;
    component.toggleSettingsPage();
    expect(videoService.setSettings).toHaveBeenCalledWith(false);
  });

  it('toggleFullscreen calls setFullscreen with inverse of current request', () => {
    videoService.pushFullscreen(false);
    fixture.detectChanges();
    (component as any).fullscreenRequest = false;
    component.toggleFullscreen();
    expect(videoService.setFullscreen).toHaveBeenCalledWith(true);

    (component as any).fullscreenRequest = true;
    component.toggleFullscreen();
    expect(videoService.setFullscreen).toHaveBeenCalledWith(false);
  });

  it('keyHandler handles shortcuts and arrow keys when not typing', () => {
    settingsService.pushSettings({ stopVideoOnNote: false, shortcuts: { note: 'n', settings: 's' } } as unknown as Settings);
    fixture.detectChanges();

    spyOn(component as any, 'toggleNotePage').and.callThrough();
    spyOn(component as any, 'toggleSettingsPage').and.callThrough();
    spyOn(component, 'onRewind').and.callThrough();
    spyOn(component, 'onForward').and.callThrough();

    const eNote = new KeyboardEvent('keydown', { key: 'N', shiftKey: true, cancelable: true });
    window.dispatchEvent(eNote);
    expect((component as any).toggleNotePage).toHaveBeenCalled();

    const eSettings = new KeyboardEvent('keydown', { key: 'S', shiftKey: true, cancelable: true });
    window.dispatchEvent(eSettings);
    expect((component as any).toggleSettingsPage).toHaveBeenCalled();

    const eLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
    window.dispatchEvent(eLeft);
    expect(videoService.emitRewind).toHaveBeenCalled();

    const eRight = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    window.dispatchEvent(eRight);
    expect(videoService.emitForward).toHaveBeenCalled();
  });

  it('ngOnDestroy unsubscribes and removes keydown listener', () => {
    const removeSpy = spyOn(window, 'removeEventListener').and.callThrough();
    component.ngOnDestroy();
    expect(removeSpy).toHaveBeenCalledWith('keydown', (component as any).keyHandler);
    videoService.pushVolume(88);
    expect((component as any).previousVolume).not.toBe(88);
  });
});
