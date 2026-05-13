import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoNavbar } from './video-navbar';
import { BehaviorSubject, of } from 'rxjs';
import { Settings } from '../models/settings';

class MockVideoService {
  isActive$ = new BehaviorSubject<boolean>(false);
  duration$ = new BehaviorSubject<number>(0);
  isNote$ = new BehaviorSubject<boolean>(false);
  isSettings$ = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = new BehaviorSubject<boolean>(false);

  getPlaying() { return of(true); }
  getVolume() { return of(50); }
  getDuration() { return of(120); }
  getCurrentTime() { return of(1); }
  getNote() { return this.isNote$.asObservable(); }
  getSettings() { return this.isSettings$.asObservable(); }
  getFullscreen() { return this.fullscreenRequest$.asObservable(); }

  emitTogglePlay = jasmine.createSpy('emitTogglePlay');
  emitRewind = jasmine.createSpy('emitRewind');
  emitForward = jasmine.createSpy('emitForward');

  setVolume = jasmine.createSpy('setVolume');
  setTime = jasmine.createSpy('setTime');
  setNote = jasmine.createSpy('setNote');
  setSettings = jasmine.createSpy('setSettings');
  setFullscreen = jasmine.createSpy('setFullscreen');
  setPlaying = jasmine.createSpy('setPlaying');
}

class MockSettingsService {
  videoForwardRate$ = new BehaviorSubject<number>(10);
  videoRewindRate$ = new BehaviorSubject<number>(5);
  settings$ = new BehaviorSubject<Settings>({
    stopVideoOnNote: true,
    shortcuts: { note: 'n', settings: 's' }
  } as any);
}

describe('VideoNavbar', () => {
  let component: VideoNavbar;
  let fixture: ComponentFixture<VideoNavbar>;
  let videoService: MockVideoService;
  let settingsService: MockSettingsService;

  beforeEach(async () => {
    videoService = new MockVideoService();
    settingsService = new MockSettingsService();

    await TestBed.configureTestingModule({
      declarations: [VideoNavbar],
      providers: [
        { provide: (VideoNavbar as any).ɵprov?.factory || 'VideoService', useValue: videoService },
        { provide: (VideoNavbar as any).ɵprov?.factory || 'SettingsService', useValue: settingsService }
      ]
    }).compileComponents();

    component = new VideoNavbar(videoService as any, settingsService as any);
    fixture = { componentInstance: component } as any;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should subscribe and initialize observables and state on ngOnInit', () => {
    spyOn(window, 'addEventListener').and.callThrough();
    component.ngOnInit();

    expect(component.isPlaying$).toBeDefined();
    expect(component.volumePercentage$).toBeDefined();
    expect(component.duration$).toBeDefined();
    expect(component.currentTime$).toBeDefined();
    expect(component.isNote$).toBeDefined();
    expect(component.isSettings$).toBeDefined();
    expect(component.fullscreenRequest$).toBeDefined();

    expect((component as any).duration).toBe(0);
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', (component as any).keyHandler);
  });

  it('should call videoService.emitTogglePlay when onTogglePlay is called', () => {
    component.onTogglePlay();
    expect(videoService.emitTogglePlay).toHaveBeenCalled();
  });

  it('should call emitRewind and emitForward with configured rates', () => {
    component.ngOnInit();
    component.onRewind();
    expect(videoService.emitRewind).toHaveBeenCalledWith(5);

    component.onForward();
    expect(videoService.emitForward).toHaveBeenCalledWith(10);
  });

  it('setVolume should parse and call setVolume on service', () => {
    component.setVolume('33');
    expect(videoService.setVolume).toHaveBeenCalledWith(33);
  });

  it('mute should set volume to 0 and unMute should restore previousVolume', () => {
    component.mute();
    expect(videoService.setVolume).toHaveBeenCalledWith(0);

    (component as any).previousVolume = 42;
    component.unMute();
    expect(videoService.setVolume).toHaveBeenCalledWith(42);
  });

  it('setCurrentTimeByClick should compute and call setTime', () => {
    (component as any).duration = 200;

    const progressBar = document.createElement('progress');
    spyOn(progressBar, 'getBoundingClientRect').and.returnValue({ left: 10 } as DOMRect);
    Object.defineProperty(progressBar, 'clientWidth', { get: () => 90 });

    const event = { target: progressBar, clientX: 55 } as unknown as MouseEvent;
    component.setCurrentTimeByClick(event);
    const expectedTime = (45 / 90) * 200;
    expect(videoService.setTime).toHaveBeenCalledWith(expectedTime);
  });

  it('toggleNotePage should close settings if open and toggle note state and stop video depending on settings', () => {
    component.ngOnInit();
    (component as any).isSettings = true;
    (component as any).isNote = false;
    component.toggleNotePage();
    expect(videoService.setSettings).toHaveBeenCalled();
    expect(videoService.setNote).toHaveBeenCalledWith(true);
  });

  it('toggleSettingsPage should close note if open and toggle settings state and stop video depending on settings', () => {
    component.ngOnInit();
    (component as any).isNote = true;
    (component as any).isSettings = false;
    component.toggleSettingsPage();
    expect(videoService.setNote).toHaveBeenCalled();
    expect(videoService.setSettings).toHaveBeenCalledWith(true);
  });

  it('toggleFullscreen should call setFullscreen with inverted state', () => {
    (component as any).fullscreenRequest = false;
    component.toggleFullscreen();
    expect(videoService.setFullscreen).toHaveBeenCalledWith(true);

    (component as any).fullscreenRequest = true;
    component.toggleFullscreen();
    expect(videoService.setFullscreen).toHaveBeenCalledWith(false);
  });

  it('isTypingInField should detect input/textarea/contentEditable and return correct values', () => {
    const activeSpy = spyOnProperty(document, 'activeElement', 'get');

    activeSpy.and.returnValue(null);
    expect((component as any).isTypingInField()).toBeFalse();

    const input = document.createElement('input');
    activeSpy.and.returnValue(input);
    expect((component as any).isTypingInField()).toBeTrue();

    const ta = document.createElement('textarea');
    activeSpy.and.returnValue(ta);
    expect((component as any).isTypingInField()).toBeTrue();

    const div = document.createElement('div');
    div.contentEditable = 'true';
    activeSpy.and.returnValue(div);
    expect((component as any).isTypingInField()).toBeTrue();

    const span = document.createElement('span');
    activeSpy.and.returnValue(span);
    expect((component as any).isTypingInField()).toBeFalse();

    activeSpy.and.callThrough();
  });

  it('keyHandler should handle shortcuts and arrow keys only when active', () => {
    component.ngOnInit();
    (component as any).isActive = true;
    (component as any).settings = { shortcuts: { note: 'n', settings: 's' }, stopVideoOnNote: true } as Settings;

    spyOn(component as any, 'setKeyboardEvent').and.callThrough();
    spyOn(component, 'toggleNotePage');
    spyOn(component, 'toggleSettingsPage');
    spyOn(component, 'onRewind');
    spyOn(component, 'onForward');

    const noteEvent = new KeyboardEvent('keydown', { key: 'N', shiftKey: true });
    (component as any).keyHandler(noteEvent);
    expect((component as any).setKeyboardEvent).toHaveBeenCalled();
    expect(component.toggleNotePage).toHaveBeenCalled();

    const settingsEvent = new KeyboardEvent('keydown', { key: 'S', shiftKey: true });
    (component as any).keyHandler(settingsEvent);
    expect(component.toggleSettingsPage).toHaveBeenCalled();

    spyOn(component as any, 'isTypingInField').and.returnValue(false);
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    (component as any).keyHandler(leftEvent);
    expect(component.onRewind).toHaveBeenCalled();

    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    (component as any).keyHandler(rightEvent);
    expect(component.onForward).toHaveBeenCalled();
  });

  it('ngOnDestroy should unsubscribe and remove window listener', () => {
    spyOn(window, 'removeEventListener').and.callThrough();
    component.ngOnInit();
    component.ngOnDestroy();
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', (component as any).keyHandler);
  });
});
