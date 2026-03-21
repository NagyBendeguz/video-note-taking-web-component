import { Component } from '@angular/core';
import { VideoService } from '../services/video';
import { Observable, Subject, takeUntil } from 'rxjs';

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
  private unsubscribe$ = new Subject<void>();

  constructor(public videoService: VideoService) {}

  ngOnInit() {
    this.isPlaying$ = this.videoService.getPlaying();

    this.volumePercentage$ = this.videoService.getVolume();

    this.volumePercentage$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVolume => {
      // Csak akkor mentse le a hangerő változást ha nem nulla a jelenlegi hangerő.
      if (currentVolume !== 0)
      {
        this.previousVolume = currentVolume;
      }
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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
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
    this.videoService.emitRewind(10);
  }

  /**
   * Előre tekerés kibocsátása.
   */
  onForward(): void {
    this.videoService.emitForward(10);
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
    this.videoService.setSettings(!this.isSettings);
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  toggleFullscreen(): void {
    this.videoService.setFullscreen(!this.fullscreenRequest);
  }
}
