import { Component } from '@angular/core';
import { VideoService } from '../services/video';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { SettingsService } from '../services/settings';

@Component({
  selector: 'app-video-navbar',
  standalone: false,
  templateUrl: './video-navbar.html',
  styleUrl: './video-navbar.sass',
})
export class VideoNavbar {
  isPlaying$!: Observable<boolean>;
  volumePercentage$!: Observable<number>;
  private previousVolume: number = 100;
  duration$!: Observable<number>;
  private duration: number = 0;
  currentTime$!: Observable<number>;
  isNote$!: Observable<boolean>;
  private isNote: boolean = false;
  isSettings$!: Observable<boolean>;
  private isSettings: boolean = false;
  fullscreenRequest$!: Observable<boolean>;
  private fullscreenRequest: boolean = false;
  private videoForwardRate!: number;
  private videoRewindRate!: number;
  private unsubscribe$ = new Subject<void>();

  constructor(private videoService: VideoService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.isPlaying$ = this.videoService.getPlaying();

    this.volumePercentage$ = this.videoService.getVolume();

    this.volumePercentage$
    .pipe(
      takeUntil(this.unsubscribe$),
      // Csak akkor mentse le a hangerő változást ha nem nulla a jelenlegi hangerő.
      filter(currentVolume => currentVolume !== 0)
    )
    .subscribe(currentVolume => {
      this.previousVolume = currentVolume;
    });

    this.duration$ = this.videoService.getDuration();

    this.videoService.duration$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentDuration => {
      this.duration = currentDuration;
    });

    this.currentTime$ = this.videoService.getCurrentTime();

    this.isNote$ = this.videoService.getNote();

    this.videoService.isNote$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsNote => {
      this.isNote = currentIsNote;
    });

    this.isSettings$ = this.videoService.getSettings();

    this.videoService.isSettings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsSettings => {
      this.isSettings = currentIsSettings;
    });

    this.fullscreenRequest$ = this.videoService.getFullscreen();

    this.videoService.fullscreenRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentFullscreenRequest => {
      this.fullscreenRequest = currentFullscreenRequest;
    });

    this.settingsService.videoForwardRate$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVideoForwardRate => {
      this.videoForwardRate = currentVideoForwardRate;
    });

    this.settingsService.videoRewindRate$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVideoRewindRate => {
      this.videoRewindRate = currentVideoRewindRate;
    });

    window.addEventListener('keydown', this.keyHandler);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    window.removeEventListener('keydown', this.keyHandler);
  }

  /**
   * Indítás és megállítás kibocsátása.
   */
  onTogglePlay(): void {
    this.videoService.emitTogglePlay();
  }

  /**
   * Hátra tekerés kibocsátása.
   */
  onRewind(): void {
    this.videoService.emitRewind(this.videoRewindRate);
  }

  /**
   * Előre tekerés kibocsátása.
   */
  onForward(): void {
    this.videoService.emitForward(this.videoForwardRate);
  }

  /**
   * A videó hangerejének szabályozása csúszkával.
   * @param value - Hangerő.
   */
  setVolume(value: string): void {
    const volume = Number(value);
    this.videoService.setVolume(volume);
  }

  /**
   * A videó némítása gombnyomásra.
   */
  mute(): void {
    this.videoService.setVolume(0);
  }

  /**
   * A videó hangerejének gombnyomásra való visszaállítása az előző hangerőre (ami nem nulla).
   */
  unMute(): void {
    this.videoService.setVolume(this.previousVolume);
  }

  /**
   * A videó jelenlegi idejének beállítása a progress bar-ra való kattintással.
   * @param event - Az egér kattintási eseménye a videó progress bar-ján.
   */
  setCurrentTimeByClick(event: MouseEvent): void {
    // Az új időhöz szükséges változók kiszámítása.
    const progressBar = event.target as HTMLProgressElement;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.clientWidth;

    // Az új idő kiszámítása.
    const newTime = (clickPosition / barWidth) * this.duration;

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: newTime }));
  }

  /**
   * A jegyzetelés oldal ki-be kapcsolása.
   */
  toggleNotePage(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isSettings)
    {
      this.toggleSettingsPage();
    }

    // A videó megállitása vagy folytatása.
    if (!this.isNote)
    {
      this.videoService.setPlaying(false);
    }
    else
    {
      this.videoService.setPlaying(true);
    }

    this.videoService.setNote(!this.isNote);
  }

  /**
   * A beállítások oldal ki-be kapcsolása.
   */
  toggleSettingsPage(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isNote)
    {
      this.toggleNotePage();
    }

    // A videó megállitása vagy folytatása.
    if (!this.isSettings)
    {
      this.videoService.setPlaying(false);
    }
    else
    {
      this.videoService.setPlaying(true);
    }

    this.videoService.setSettings(!this.isSettings);
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  toggleFullscreen(): void {
    this.videoService.setFullscreen(!this.fullscreenRequest);
  }

  // TODO: helyesen felülírni a böngésző alap billentyűkombinációját
  private keyHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'm')
    {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.toggleNotePage();
    }
  };
}
