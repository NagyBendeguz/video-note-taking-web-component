import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { VideoService } from './video';

describe('VideoService', () => {
  let service: VideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoService],
    });
    service = TestBed.inject(VideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('BehaviorSubjects (get/set)', () => {
    it('tracks playing state', (done) => {
      service.setPlaying(true);
      service.getPlaying().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(true);
        done();
      });
    });

    it('tracks volume', (done) => {
      service.setVolume(42);
      service.getVolume().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(42);
        done();
      });
    });

    it('tracks duration', (done) => {
      service.setDuration(123);
      service.getDuration().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(123);
        done();
      });
    });

    it('tracks currentTime', (done) => {
      service.setCurrentTime(12.5);
      service.getCurrentTime().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(12.5);
        done();
      });
    });

    it('tracks note flag', (done) => {
      service.setNote(true);
      service.getNote().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(true);
        done();
      });
    });

    it('tracks settings flag', (done) => {
      service.setSettings(true);
      service.getSettings().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(true);
        done();
      });
    });

    it('tracks fullscreen request', (done) => {
      service.setFullscreen(true);
      service.getFullscreen().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(true);
        done();
      });
    });

    it('tracks thumbnail', (done) => {
      const url = 'https://example.com/thumb.png';
      service.setThumbnail(url);
      service.getThumbnail().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(url);
        done();
      });
    });

    it('tracks timestamp', (done) => {
      const ts = '01:02:03.456';
      service.setTimestamp(ts);
      service.getTimestamp().pipe(take(1)).subscribe((v) => {
        expect(v).toBe(ts);
        done();
      });
    });
  });

  describe('Subjects (time & isActive)', () => {
    it('emits time via setTime', (done) => {
      service.time$.pipe(take(1)).subscribe((t) => {
        expect(t).toBe(999);
        done();
      });
      service.setTime(999);
    });

    it('emits isActive via setIsActive', (done) => {
      service.isActive$.pipe(take(1)).subscribe((v) => {
        expect(v).toBe(true);
        done();
      });
      service.setIsActive(true);
    });
  });

  describe('EventEmitters (toggle/rewind/forward/jump)', () => {
    it('emitTogglePlay triggers togglePlay', (done) => {
      service.togglePlay.subscribe(() => {
        done();
      });
      service.emitTogglePlay();
    });

    it('emitRewind emits provided number', (done) => {
      const rate = -10;
      service.rewind.subscribe((val) => {
        expect(val).toBe(rate);
        done();
      });
      service.emitRewind(rate);
    });

    it('emitForward emits provided number', (done) => {
      const rate = 15;
      service.forward.subscribe((val) => {
        expect(val).toBe(rate);
        done();
      });
      service.emitForward(rate);
    });

    it('emitJumpToTimestamp triggers jumpToTimestamp', (done) => {
      service.jumpToTimestamp.subscribe(() => {
        done();
      });
      service.emitJumpToTimestamp();
    });
  });

  it('initial default values are correct', () => {
    let playing: boolean | undefined;
    service.getPlaying().pipe(take(1)).subscribe((v) => (playing = v));
    expect(playing).toBe(false);

    let volume: number | undefined;
    service.getVolume().pipe(take(1)).subscribe((v) => (volume = v));
    expect(volume).toBe(100);

    let duration: number | undefined;
    service.getDuration().pipe(take(1)).subscribe((v) => (duration = v));
    expect(duration).toBe(0);

    let currentTime: number | undefined;
    service.getCurrentTime().pipe(take(1)).subscribe((v) => (currentTime = v));
    expect(currentTime).toBe(0);

    let isNote: boolean | undefined;
    service.getNote().pipe(take(1)).subscribe((v) => (isNote = v));
    expect(isNote).toBe(false);

    let isSettings: boolean | undefined;
    service.getSettings().pipe(take(1)).subscribe((v) => (isSettings = v));
    expect(isSettings).toBe(false);

    let fullscreen: boolean | undefined;
    service.getFullscreen().pipe(take(1)).subscribe((v) => (fullscreen = v));
    expect(fullscreen).toBe(false);

    let thumbnail: string | undefined;
    service.getThumbnail().pipe(take(1)).subscribe((v) => (thumbnail = v));
    expect(thumbnail).toBe('');

    let timestamp: string | undefined;
    service.getTimestamp().pipe(take(1)).subscribe((v) => (timestamp = v));
    expect(timestamp).toBe('00:00:00.000');
  });
});
