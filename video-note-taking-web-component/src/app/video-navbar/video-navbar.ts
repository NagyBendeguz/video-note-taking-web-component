import { Component, EventEmitter, Output } from '@angular/core';
import { Video } from '../services/video';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-video-navbar',
  standalone: false,
  templateUrl: './video-navbar.html',
  styleUrl: './video-navbar.sass',
})
export class VideoNavbar {
  @Output() togglePlay = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() forward = new EventEmitter<void>();
  private subscriptions: Subscription = new Subscription();
  isPlaying$: Observable<boolean> = new Observable<boolean>();
  volumePercentage$: Observable<number> = new Observable<number>();
  previousVolume: number = 100;
  duration$: Observable<number> = new Observable<number>();
  duration: number = 0;
  currentTime$: Observable<number> = new Observable<number>();
  isSettings$: Observable<boolean> = new Observable<boolean>();
  isSettings: boolean = false;
  fullscreenRequest$: Observable<boolean> = new Observable<boolean>();
  fullscreenRequest: boolean = false;

  constructor(public videoService: Video) {}

  ngOnInit() {
    this.isPlaying$ = this.videoService.getPlaying();

    this.volumePercentage$ = this.videoService.getVolume();

    this.subscriptions.add(this.volumePercentage$.subscribe(currentVolume => {
      // Csak akkor mentse le a hangerő változást ha nem nulla a jelenlegi hangerő.
      if (currentVolume !== 0)
      {
        this.previousVolume = currentVolume;
      }
    }));

    this.duration$ = this.videoService.getDuration();

    this.subscriptions.add(this.videoService.duration$.subscribe(duration => {
      this.duration = duration;
    }));

    this.currentTime$ = this.videoService.getCurrentTime();

    this.isSettings$ = this.videoService.getSettings();

    this.fullscreenRequest$ = this.videoService.getFullscreen();
  }

  /**
   * Indítás és megállítás kibocsátása.
   */
  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  /**
   * Hátra tekerés kibocsátása.
   */
  onRewind(): void {
    this.rewind.emit();
  }

  /**
   * Előre tekerés kibocsátása.
   */
  onForward(): void {
    this.forward.emit();
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

    const newTime = (clickPosition / barWidth) * this.duration;

    this.videoService.setCurrentTime(newTime);

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: newTime }));
  }

  setNote(): void {

  }

  /**
   * A beállítások oldal ki-be kapcsolása.
   */
  setSettings(): void {
    this.videoService.setSettings(!this.isSettings);
    this.isSettings = !this.isSettings;
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  setFullscreen(): void {
    this.videoService.setFullscreen(!this.fullscreenRequest);
    this.fullscreenRequest = !this.fullscreenRequest;
  }

  ngOnDestroy(): void {
    if (this.subscriptions)
    {
      this.subscriptions.unsubscribe();
    }
  }
}
