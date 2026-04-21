import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { VideoSettings } from './video-settings';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import DOMPurify from 'dompurify';
import { MockTranslateService } from '../../test-utils/mock-translate.service';

class MockSettingsService {
  private settingsSubject = new BehaviorSubject<any>({ confirmCancel: false, confirmDelete: false, shortcuts: {} });
  settings$ = this.settingsSubject.asObservable();

  videoNavbarOffset$ = new Subject<boolean>();
  fullscreen$ = new Subject<boolean>();

  getSettings() { return this.settings$; }
  getVideoNavbarOffset() { return of(false); }
  getVideoForwardRate() { return of(10); }
  getVideoRewindRate() { return of(10); }

  setPlaybackRate = jasmine.createSpy('setPlaybackRate');
  setVideoForwardRate = jasmine.createSpy('setVideoForwardRate');
  setVideoRewindRate = jasmine.createSpy('setVideoRewindRate');
  toggleSubtitles = jasmine.createSpy('toggleSubtitles');
  toggleVideoNavbarOffset = jasmine.createSpy('toggleVideoNavbarOffset');
  setLanguage = jasmine.createSpy('setLanguage');
  setTheme = jasmine.createSpy('setTheme');
  toggleSaveSettings = jasmine.createSpy('toggleSaveSettings');
  toggleConvertInput = jasmine.createSpy('toggleConvertInput');
  toggleStopVideoOnNote = jasmine.createSpy('toggleStopVideoOnNote');
  toggleStartVideoOnSave = jasmine.createSpy('toggleStartVideoOnSave');
}

class MockEntryService {
  setArrayEntry = jasmine.createSpy('setArrayEntry');
  setCurrentEntryId = jasmine.createSpy('setCurrentEntryId');
}

class MockVideoService {
  private fs = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = this.fs.asObservable();
  getFullscreen() { return of(false); }
  emitFullscreen(val: boolean) { (this.fs as any).next(val); }
}

describe('VideoSettings', () => {
  let fixture: ComponentFixture<VideoSettings>;
  let component: VideoSettings;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;
  let settingsService: MockSettingsService;
  let entryService: MockEntryService;
  let videoService: MockVideoService;
  let translate: MockTranslateService;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });
    settingsService = new MockSettingsService();
    entryService = new MockEntryService();
    videoService = new MockVideoService();
    translate = new MockTranslateService();

    await TestBed.configureTestingModule({
      declarations: [VideoSettings],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: 'SettingsService', useValue: settingsService },
        { provide: 'EntryService', useValue: entryService },
        { provide: 'VideoService', useValue: videoService },
        { provide: TranslateService, useValue: mockTranslate },
        { provide: (VideoSettings as any).ctorParameters?.()[0]?.type || 'SettingsService', useValue: settingsService },
        { provide: (VideoSettings as any).ctorParameters?.()[1]?.type || 'EntryService', useValue: entryService },
        { provide: (VideoSettings as any).ctorParameters?.()[2]?.type || 'VideoService', useValue: videoService },
      ],
      schemas: []
    }).compileComponents();

    fixture = TestBed.createComponent(VideoSettings);
    component = fixture.componentInstance;

    (component as any).settingsService = settingsService as any;
    (component as any).entryService = entryService as any;
    (component as any).videoService = videoService as any;
    (component as any).translate = translate as any;

    component.settings = {
      confirmCancel: false,
      confirmDelete: false,
      shortcuts: {
        note: 'n', settings: 'q', thumbnailMoveForward: 'f', thumbnailMoveRewind: 'r',
        save: 's', cancel: 'c', bold: 'b', italic: 'i', strikethrough: 'h',
        orderedList: 'o', unorderedList: 'u'
      },
      thumbnailQualityPercentage: 100,
      thumbnailWidth: 1,
      thumbnailHeight: 1,
      thumbnailForwardRate: 1,
      thumbnailRewindRate: 1
    } as any;

    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('changePlaybackSpeed calls settingsService.setPlaybackRate', () => {
    const select = { target: { value: '1.25' } } as any as Event;
    component.changePlaybackSpeed(select);
    expect(settingsService.setPlaybackRate).toHaveBeenCalledWith(1.25);
  });

  it('setVideoForwardRate sanitizes and sets valid value, defaults on invalid/zero', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    const good = { target: { value: '15' } } as any as Event;
    component.setVideoForwardRate(good);
    expect(settingsService.setVideoForwardRate).toHaveBeenCalledWith(15);

    const zero = { target: { value: '0' } } as any as Event;
    component.setVideoForwardRate(zero);
    expect(settingsService.setVideoForwardRate).toHaveBeenCalledWith(10);

    const nan = { target: { value: 'abc' } } as any as Event;
    component.setVideoForwardRate(nan);
    expect(settingsService.setVideoForwardRate).toHaveBeenCalledWith(10);
  });

  it('setVideoRewindRate sanitizes and sets valid value, defaults on invalid/zero', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    const good = { target: { value: '7' } } as any as Event;
    component.setVideoRewindRate(good);
    expect(settingsService.setVideoRewindRate).toHaveBeenCalledWith(7);

    const zero = { target: { value: '0' } } as any as Event;
    component.setVideoRewindRate(zero);
    expect(settingsService.setVideoRewindRate).toHaveBeenCalledWith(10);

    const nan = { target: { value: 'x' } } as any as Event;
    component.setVideoRewindRate(nan);
    expect(settingsService.setVideoRewindRate).toHaveBeenCalledWith(10);
  });

  it('toggleSubtitles flips local flag and calls service', () => {
    const before = component.isSubtitleVisible;
    component.toggleSubtitles();
    expect(settingsService.toggleSubtitles).toHaveBeenCalled();
    expect(component.isSubtitleVisible).toBe(!before);
  });

  it('toggleOffset does not call service when fullscreen true', () => {
    (component as any).isFullscreen = true;
    component.toggleOffset();
    expect(settingsService.toggleVideoNavbarOffset).not.toHaveBeenCalled();

    (component as any).isFullscreen = false;
    component.toggleOffset();
    expect(settingsService.toggleVideoNavbarOffset).toHaveBeenCalled();
  });

  it('changeLang calls settingsService.setLanguage and translate.use', () => {
    const ev = { target: { value: 'hu' } } as any as Event;
    component.changeLang(ev);
    expect(settingsService.setLanguage).toHaveBeenCalledWith('hu');
    expect(translate.use).toHaveBeenCalledWith('hu');
  });

  it('changeTheme calls settingsService.setTheme', () => {
    const ev = { target: { value: 'dark' } } as any as Event;
    component.changeTheme(ev);
    expect(settingsService.setTheme).toHaveBeenCalledWith('dark');
  });

  it('toggleConfirmCancel and toggleConfirmDelete flip settings locally', () => {
    component.settings.confirmCancel = false;
    component.settings.confirmDelete = false;
    component.toggleConfirmCancel();
    expect(component.settings.confirmCancel).toBeTrue();
    component.toggleConfirmDelete();
    expect(component.settings.confirmDelete).toBeTrue();
  });

  it('thumbnail setters sanitize and bound values on negative/NaN', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.setThumbnailQualityPercentage({ target: { value: '50' } } as any as Event);
    expect(component.settings.thumbnailQualityPercentage).toBe(50);

    component.setThumbnailQualityPercentage({ target: { value: '-10' } } as any as Event);
    expect(component.settings.thumbnailQualityPercentage).toBe(100);

    component.setThumbnailWidth({ target: { value: '5' } } as any as Event);
    expect(component.settings.thumbnailWidth).toBe(5);

    component.setThumbnailWidth({ target: { value: '-1' } } as any as Event);
    expect(component.settings.thumbnailWidth).toBe(1);

    component.setThumbnailHeight({ target: { value: '6' } } as any as Event);
    expect(component.settings.thumbnailHeight).toBe(6);

    component.setThumbnailHeight({ target: { value: 'foo' } } as any as Event);
    expect(component.settings.thumbnailHeight).toBe(1);

    component.setThumbnailForwardRate({ target: { value: '2' } } as any as Event);
    expect(component.settings.thumbnailForwardRate).toBe(2);

    component.setThumbnailForwardRate({ target: { value: '0' } } as any as Event);
    expect(component.settings.thumbnailForwardRate).toBe(1);

    component.setThumbnailRewindRate({ target: { value: '3' } } as any as Event);
    expect(component.settings.thumbnailRewindRate).toBe(3);

    component.setThumbnailRewindRate({ target: { value: '-2' } } as any as Event);
    expect(component.settings.thumbnailRewindRate).toBe(1);
  });

  it('shortcut setters pick first char or default', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.setShortcutNote({ target: { value: 'z' } } as any as Event);
    expect(component.settings.shortcuts.note).toBe('z');

    component.setShortcutSettings({ target: { value: '' } } as any as Event);
    expect(component.settings.shortcuts.settings).toBe('q'); // default

    component.setShortcutBold({ target: { value: 'Xyz' } } as any as Event);
    expect(component.settings.shortcuts.bold).toBe('X');
  });

  /*describe('onFileChange', () => {
    let originalFileReader: any;

    beforeEach(() => {
      originalFileReader = (window as any).FileReader;
    });

    afterEach(() => {
      (window as any).FileReader = originalFileReader;
    });

    it('parses valid JSON, sanitizes entries, sets entries and current id', () => {
      const json = JSON.stringify([
        { entryId: 1, title: ' a ', timestamp: '0:00', note: ' note ', thumbnail: 't' },
        { entryId: 5, title: 'b', timestamp: '0:01', note: 'n', thumbnail: 't2' }
      ]);

      // fake FileReader
      class FR {
        onload: any;
        readAsText() { setTimeout(() => this.onload({ target: { result: json } }), 0); }
      }
      (window as any).FileReader = FR;

      spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => (typeof v === 'string' ? v.trim() : v));
      const blob = new Blob([json], { type: 'application/json' });
      const file = new File([blob], 'test.json', { type: 'application/json' });

      const input = { target: { files: [file] } } as any as Event;
      component.onFileChange(input);

      tick(); // allow async FileReader to fire

      expect(entryService.setArrayEntry).toHaveBeenCalled();
      expect(entryService.setCurrentEntryId).toHaveBeenCalledWith(5);
    });

    it('handles invalid JSON structure (ajv validation fail) without calling entryService', () => {
      const badJson = JSON.stringify([{ wrong: 'schema' }]);

      class FR {
        onload: any;
        readAsText() { setTimeout(() => this.onload({ target: { result: badJson } }), 0); }
      }
      (window as any).FileReader = FR;

      const blob = new Blob([badJson], { type: 'application/json' });
      const file = new File([blob], 'bad.json', { type: 'application/json' });

      spyOn(console, 'error');

      component.onFileChange({ target: { files: [file] } } as any as Event);
      tick();

      expect(entryService.setArrayEntry).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles parse error gracefully', () => {
      const invalid = '{ not: json ';
      class FR {
        onload: any;
        readAsText() { setTimeout(() => this.onload({ target: { result: invalid } }), 0); }
      }
      (window as any).FileReader = FR;
      spyOn(console, 'error');

      const blob = new Blob([invalid], { type: 'application/json' });
      const file = new File([blob], 'inv.json', { type: 'application/json' });

      component.onFileChange({ target: { files: [file] } } as any as Event);
      tick();

      expect(entryService.setArrayEntry).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });*/

  it('ngOnDestroy unsubscribes', () => {
    const sub = (component as any).unsubscribe$;
    spyOn(sub, 'next').and.callThrough();
    spyOn(sub, 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(sub.next).toHaveBeenCalled();
    expect(sub.complete).toHaveBeenCalled();
  });
});
