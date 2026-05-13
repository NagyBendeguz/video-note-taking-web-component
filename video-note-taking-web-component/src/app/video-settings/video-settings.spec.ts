import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoSettings } from './video-settings';
import { SettingsService } from '../services/settings';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import DOMPurify from 'dompurify';
import { MockTranslateService } from '../../test-utils/mock-translate.service';

class Settings {
  language = 'en';
  confirmCancel = true;
  confirmDelete = true;
  thumbnailQualityPercentage = 100;
  thumbnailWidth = 1;
  thumbnailHeight = 1;
  thumbnailForwardRate = 1;
  thumbnailRewindRate = 1;
  shortcuts: any = {};
}

const settingsSubject = new Subject<any>();
const videoFullscreenSubject = new Subject<boolean>();
const videoNavbarOffsetSubject = new Subject<boolean>();

const mockSettingsService = {
  getSettings: jasmine.createSpy('getSettings').and.returnValue(of(new Settings())),
  settings$: settingsSubject.asObservable(),
  getVideoNavbarOffset: jasmine.createSpy('getVideoNavbarOffset').and.returnValue(of(false)),
  videoNavbarOffset$: videoNavbarOffsetSubject.asObservable(),
  setSettings: jasmine.createSpy('setSettings'),
  setPlaybackRate: jasmine.createSpy('setPlaybackRate'),
  setVideoForwardRate: jasmine.createSpy('setVideoForwardRate'),
  setVideoRewindRate: jasmine.createSpy('setVideoRewindRate'),
  toggleSubtitles: jasmine.createSpy('toggleSubtitles'),
  toggleVideoNavbarOffset: jasmine.createSpy('toggleVideoNavbarOffset'),
  setLanguage: jasmine.createSpy('setLanguage'),
  setTheme: jasmine.createSpy('setTheme'),
  toggleSaveSettings: jasmine.createSpy('toggleSaveSettings'),
  toggleConvertInput: jasmine.createSpy('toggleConvertInput'),
  toggleStopVideoOnNote: jasmine.createSpy('toggleStopVideoOnNote'),
  toggleStartVideoOnSave: jasmine.createSpy('toggleStartVideoOnSave'),
  setOffset: jasmine.createSpy('setOffset'),
  getVideoForwardRate: jasmine.createSpy('getVideoForwardRate').and.returnValue(of(10)),
  getVideoRewindRate: jasmine.createSpy('getVideoRewindRate').and.returnValue(of(10))
};

const mockEntryService = {
  setArrayEntry: jasmine.createSpy('setArrayEntry'),
  setCurrentEntryId: jasmine.createSpy('setCurrentEntryId')
};

const mockVideoService = {
  getFullscreen: jasmine.createSpy('getFullscreen').and.returnValue(of(false)),
  fullscreenRequest$: videoFullscreenSubject.asObservable()
};

describe('VideoSettings (unit)', () => {
  let component: VideoSettings;
  let fixture: ComponentFixture<VideoSettings>;
  let mockTranslate: MockTranslateService;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();

    await TestBed.configureTestingModule({
      declarations: [VideoSettings],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: EntryService, useValue: mockEntryService },
        { provide: VideoService, useValue: mockVideoService },
        { provide: TranslateService, useValue: mockTranslate }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    (mockSettingsService.setSettings as jasmine.Spy).calls.reset();
    (mockEntryService.setArrayEntry as jasmine.Spy).calls.reset();
    (mockEntryService.setCurrentEntryId as jasmine.Spy).calls.reset();
  });

  it('initializes observables and calls translate.use on settings update', () => {
    const s = new Settings();
    s.language = 'hu';
    settingsSubject.next(s);
    expect(mockTranslate.use).toHaveBeenCalledWith('hu');
  });

  it('changePlaybackSpeed calls settingsService.setPlaybackRate with parsed number', () => {
    const select = { target: { value: '1.5' } } as any as Event;
    component.changePlaybackSpeed(select);
    expect(mockSettingsService.setPlaybackRate).toHaveBeenCalledWith(1.5);
  });

  it('setVideoForwardRate sanitizes input and sets service value (valid)', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    const input = { target: { value: '25' } } as any as Event;
    component.setVideoForwardRate(input);
    expect(mockSettingsService.setVideoForwardRate).toHaveBeenCalledWith(25);
  });

  it('setVideoForwardRate falls back to 10 for invalid values', () => {
    spyOn(DOMPurify as any, 'sanitize').and.returnValue('not-a-number');
    const input = { target: { value: 'x' } } as any as Event;
    component.setVideoForwardRate(input);
    expect(mockSettingsService.setVideoForwardRate).toHaveBeenCalledWith(10);
  });

  it('setVideoRewindRate sanitizes input and sets service value (valid)', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    const input = { target: { value: '7' } } as any as Event;
    component.setVideoRewindRate(input);
    expect(mockSettingsService.setVideoRewindRate).toHaveBeenCalledWith(7);
  });

  it('toggleSubtitles toggles local flag and calls service', () => {
    component.isSubtitleVisible = false;
    component.toggleSubtitles();
    expect(mockSettingsService.toggleSubtitles).toHaveBeenCalled();
    expect(component.isSubtitleVisible).toBeTrue();
  });

  it('toggleOffset calls when not fullscreen', () => {
    component['isFullscreen'] = false;
    component.toggleOffset();
    expect(mockSettingsService.toggleVideoNavbarOffset).toHaveBeenCalled();
  });

  it('changeLang sets language on service and calls translate.use', () => {
    const ev = { target: { value: 'hu' } } as any as Event;
    component.changeLang(ev);
    expect(mockSettingsService.setLanguage).toHaveBeenCalledWith('hu');
    expect(mockTranslate.use).toHaveBeenCalledWith('hu');
  });

  it('changeTheme calls settingsService.setTheme', () => {
    const ev = { target: { value: 'dark' } } as any as Event;
    component.changeTheme(ev);
    expect(mockSettingsService.setTheme).toHaveBeenCalledWith('dark');
  });

  it('setThumbnailQualityPercentage sanitizes and enforces bounds', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.settings.thumbnailQualityPercentage = 50;
    component.setThumbnailQualityPercentage({ target: { value: '75' } } as any as Event);
    expect(component.settings.thumbnailQualityPercentage).toBe(75);

    component.setThumbnailQualityPercentage({ target: { value: '-1' } } as any as Event);
    expect(component.settings.thumbnailQualityPercentage).toBe(100);
  });

  it('setThumbnailWidth enforces min/max', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.setThumbnailWidth({ target: { value: '500' } } as any as Event);
    expect(component.settings.thumbnailWidth).toBe(500);

    component.setThumbnailWidth({ target: { value: '99999' } } as any as Event);
    expect(component.settings.thumbnailWidth).toBe(1);
  });

  it('setThumbnailHeight enforces min/max', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.setThumbnailHeight({ target: { value: '300' } } as any as Event);
    expect(component.settings.thumbnailHeight).toBe(300);

    component.setThumbnailHeight({ target: { value: '99999' } } as any as Event);
    expect(component.settings.thumbnailHeight).toBe(1);
  });

  it('setThumbnailForwardRate/ReplayRate enforce bounds', () => {
    spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);
    component.setThumbnailForwardRate({ target: { value: '4' } } as any as Event);
    expect(component.settings.thumbnailForwardRate).toBe(4);

    component.setThumbnailForwardRate({ target: { value: '-1' } } as any as Event);
    expect(component.settings.thumbnailForwardRate).toBe(1);

    component.setThumbnailRewindRate({ target: { value: '2' } } as any as Event);
    expect(component.settings.thumbnailRewindRate).toBe(2);

    component.setThumbnailRewindRate({ target: { value: '0' } } as any as Event);
    expect(component.settings.thumbnailRewindRate).toBe(1);
  });

  it('toggleConfirmCancel toggles settings.confirmCancel and toggleConfirmDelete toggles confirmDelete', () => {
    component.settings.confirmCancel = true;
    component.toggleConfirmCancel();
    expect(component.settings.confirmCancel).toBeFalse();

    component.settings.confirmDelete = false;
    component.toggleConfirmDelete();
    expect(component.settings.confirmDelete).toBeTrue();
  });

  it('sanitizeInput trims and sanitizes string fields but leaves others intact', () => {
    spyOn(DOMPurify as any, 'sanitize').and.callFake((s: any) => `san-${s}`);
    const inData = { title: '  hi ', entryId: 5, note: '<b>ok</b>' };
    const out = (component as any).sanitizeInput(inData);
    expect(out.title).toBe('san-  hi '.trim());
    expect(out.note).toBe('san-<b>ok</b>'.trim());
    expect(out.entryId).toBe(5);
  });

  it('setShortcut stores first character or default if empty', () => {
    spyOn(DOMPurify as any, 'sanitize').and.callFake((s: any) => s);
    component.settings.shortcuts = {} as any;
    component.setShortcut('save', { target: { value: 'x' } } as any as Event);
    expect(component.settings.shortcuts.save).toBe('x');

    component.setShortcut('save', { target: { value: '' } } as any as Event);
    expect(component.settings.shortcuts.save).toBe('s');
  });

  describe('onFileChange (file import handling)', () => {
    const originalFileReader = (window as any).FileReader;

    afterEach(() => {
      (window as any).FileReader = originalFileReader;
    });

    it('parses array JSON and passes sanitized entries to entryService and sets current id', (done) => {
      class FakeReader {
        onload: any;
        readAsText(_file: any) {
          const json = JSON.stringify([
            { entryId: 3, title: 't', timestamp: '00:00', note: 'n', thumbnail: 'thumb' }
          ]);
          setTimeout(() => {
            this.onload({ target: { result: json } });
          }, 0);
        }
      }
      (window as any).FileReader = FakeReader;

      spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);

      const file = new File([JSON.stringify([])], 'f.json', { type: 'application/json' });
      const input = { target: { files: [file] } } as any as Event;
      component.onFileChange(input);

      setTimeout(() => {
        expect(mockEntryService.setArrayEntry).toHaveBeenCalled();
        expect(mockEntryService.setCurrentEntryId).toHaveBeenCalledWith(3);
        done();
      }, 10);
    });

    it('parses object with settings and entries and calls setSettings', (done) => {
      class FakeReader2 {
        onload: any;
        readAsText(_file: any) {
          const json = JSON.stringify({
            settings: { language: 'hu', theme: 'dark' },
            entries: [
              { entryId: 1, title: 'a', timestamp: 't', note: 'n', thumbnail: 'th' }
            ]
          });
          setTimeout(() => this.onload({ target: { result: json } }), 0);
        }
      }
      (window as any).FileReader = FakeReader2;

      spyOn(DOMPurify, 'sanitize').and.callFake((v: any) => v);

      const file = new File([JSON.stringify({})], 'g.json', { type: 'application/json' });
      component.onFileChange({ target: { files: [file] } } as any as Event);

      setTimeout(() => {
        expect(mockSettingsService.setSettings).toHaveBeenCalledWith(jasmine.objectContaining({ language: 'hu' }));
        expect(mockEntryService.setArrayEntry).toHaveBeenCalled();
        expect(mockEntryService.setCurrentEntryId).toHaveBeenCalledWith(1);
        done();
      }, 10);
    });

    it('handles invalid JSON gracefully (no throws)', (done) => {
      class BadReader {
        onload: any;
        readAsText(_file: any) {
          setTimeout(() => this.onload({ target: { result: 'not json' } }), 0);
        }
      }
      (window as any).FileReader = BadReader;

      spyOn(console, 'error');

      const file = new File(['x'], 'bad.json', { type: 'application/json' });
      component.onFileChange({ target: { files: [file] } } as any as Event);

      setTimeout(() => {
        expect(console.error).toHaveBeenCalled();
        done();
      }, 10);
    });
  });
});
