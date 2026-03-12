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
  previousVolume: number = 100;
  duration$!: Observable<number>;
  durationLocal: number = 0;
  currentTime$!: Observable<number>;
  isNote$!: Observable<boolean>;
  isNoteLocal: boolean = false;
  isSettings$!: Observable<boolean>;
  isSettingsLocal: boolean = false;
  fullscreenRequest$!: Observable<boolean>;
  fullscreenRequestLocal: boolean = false;
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
      this.durationLocal = currentDuration;
    });

    this.currentTime$ = this.videoService.getCurrentTime();

    this.isNote$ = this.videoService.getNote();

    this.isSettings$ = this.videoService.getSettings();

    this.fullscreenRequest$ = this.videoService.getFullscreen();
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
   * A videó hangerejének visszaállítása gombnyomásra az előző hangerőre.
   */
  unMute(): void {
    this.videoService.setVolume(this.previousVolume);
  }

  /**
   * A videó jelenlegi idejének beállítása a progress bar-ra való kattintással.
   * @param event - Az egér kattintási eseménye a videó progress bar-ján.
   */
  setCurrentTimeByClick(event: MouseEvent): void {
    const progressBar = event.target as HTMLProgressElement;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.clientWidth;

    const newTime = (clickPosition / barWidth) * this.durationLocal;

    this.videoService.setCurrentTime(newTime);

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: newTime }));
  }

  /**
   * A jegyzetelés oldal ki-be kapcsolása.
   */
  setNote(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isSettingsLocal)
    {
      this.setSettings();
    }
    this.videoService.setNote(!this.isNoteLocal);
    this.isNoteLocal = !this.isNoteLocal;
  }

  /**
   * A beállítások oldal ki-be kapcsolása.
   */
  setSettings(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isNoteLocal)
    {
      this.setNote();
    }
    this.videoService.setSettings(!this.isSettingsLocal);
    this.isSettingsLocal = !this.isSettingsLocal;
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  setFullscreen(): void {
    this.videoService.setFullscreen(!this.fullscreenRequestLocal);
    this.fullscreenRequestLocal = !this.fullscreenRequestLocal;
  }
}
