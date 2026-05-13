import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { SettingsService } from './settings';
import { Settings } from '../models/settings';
import { take } from 'rxjs/operators';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockDocument: Document;
  let body: HTMLElement;

  beforeEach(() => {
    body = document.createElement('body');
    mockDocument = { ...document, body } as Document;

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: DOCUMENT, useValue: mockDocument }
      ]
    });

    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('initial settings$ emits default Settings', (done) => {
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s).toBeInstanceOf(Settings);
      done();
    });
  });

  it('setSettings merges values and emits updated settings', (done) => {
    service.setSettings({ language: 'en' });
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.language).toBe('en');
      done();
    });
  });

  it('setSettings updates body class when theme provided and removes previous theme classes', () => {
    body.classList.add('theme-old', 'other-class');

    service.setSettings({ theme: 'dark' });

    expect(body.classList.contains('theme-old')).toBeFalse();
    expect(body.classList.contains('theme-dark')).toBeTrue();
    expect(body.classList.contains('other-class')).toBeTrue();
  });

  it('setPlaybackRate updates playbackRate$ observable', (done) => {
    service.setPlaybackRate(1.5);
    service.playbackRate$.pipe(take(1)).subscribe(rate => {
      expect(rate).toBe(1.5);
      done();
    });
  });

  it('video forward/rewind getters and setters work', (done) => {
    service.setVideoForwardRate(15);
    service.getVideoForwardRate().pipe(take(1)).subscribe(v => expect(v).toBe(15));

    service.setVideoRewindRate(5);
    service.getVideoRewindRate().pipe(take(1)).subscribe(v => {
      expect(v).toBe(5);
      done();
    });
  });

  it('videoNavbarOffset toggles correctly', (done) => {
    service.getVideoNavbarOffset().pipe(take(1)).subscribe(v => expect(v).toBeTrue());

    service.toggleVideoNavbarOffset();
    service.getVideoNavbarOffset().pipe(take(1)).subscribe(v => expect(v).toBeFalse());

    service.toggleVideoNavbarOffset();
    service.getVideoNavbarOffset().pipe(take(1)).subscribe(v => {
      expect(v).toBeTrue();
      done();
    });
  });

  it('toggleSubtitles toggles isVisible$', (done) => {
    service.isVisible$.pipe(take(1)).subscribe(v => expect(v).toBeFalse());

    service.toggleSubtitles();
    service.isVisible$.pipe(take(1)).subscribe(v => expect(v).toBeTrue());

    service.toggleSubtitles();
    service.isVisible$.pipe(take(1)).subscribe(v => {
      expect(v).toBeFalse();
      done();
    });
  });

  it('setLanguage updates settings language', (done) => {
    service.setLanguage('fr');
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.language).toBe('fr');
      done();
    });
  });

  it('setTheme updates settings theme', (done) => {
    service.setTheme('light');
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.theme).toBe('light');
      done();
    });
  });

  it('toggleSaveSettings flips saveSettings flag', (done) => {
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.saveSettings).toBeTrue();
      service.toggleSaveSettings();
      service.getSettings().pipe(take(1)).subscribe(s2 => {
        expect(s2.saveSettings).toBeFalse();
        done();
      });
    });
  });

  it('toggleConvertInput flips convertInput flag', (done) => {
    service.toggleConvertInput();
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.convertInput).toBeFalse();
      done();
    });
  });

  it('toggleStopVideoOnNote flips stopVideoOnNote flag', (done) => {
    service.toggleStopVideoOnNote();
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.stopVideoOnNote).toBeFalse();
      done();
    });
  });

  it('toggleStartVideoOnSave flips startVideoOnSave flag', (done) => {
    service.toggleStartVideoOnSave();
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.startVideoOnSave).toBeTrue();
      done();
    });
  });

  it('updateThumbnailWidth and updateThumbnailHeight update values', (done) => {
    service.updateThumbnailWidth(200);
    service.updateThumbnailHeight(120);
    service.getSettings().pipe(take(1)).subscribe(s => {
      expect(s.thumbnailWidth).toBe(200);
      expect(s.thumbnailHeight).toBe(120);
      done();
    });
  });

  it('offset$ emits initial and new values via setOffset', (done) => {
    service.offsetChanges.pipe(take(1)).subscribe(v => expect(v).toBe('-65px'));
    service.setOffset('10px');
    service.offsetChanges.pipe(take(1)).subscribe(v => {
      expect(v).toBe('10px');
      done();
    });
  });

  it('setSettings does not change body classes when theme is not provided', () => {
    body.classList.add('theme-exist', 'something');
    service.setSettings({ language: 'es' });
    expect(body.classList.contains('theme-exist')).toBeTrue();
    expect(body.classList.contains('theme-undefined')).toBeFalse();
  });
});
