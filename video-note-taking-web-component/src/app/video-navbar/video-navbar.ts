import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { Video } from '../services/video';

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
  isPlaying: boolean = false;
  volumePercentage: number = 100;
  tempVolumePercentage: number = 100;
  duration: number = 0;
  currentTime: number = 0;
  isSettings: boolean = false;
  fullscreenRequest: boolean = false;

  constructor(private cdr: ChangeDetectorRef, public videoService: Video) {}

  ngOnInit() {
    // Frissíteni a progress bar-t a jelenlegi idővel, de ehhez Angular Elements-ben, manuális bootstrap mellett szükséges manuálisan detektálni (ChangeDetectorRef).
    document.addEventListener('updateVideoTime', (event: CustomEvent) => {
      this.currentTime = event.detail;
      this.cdr.detectChanges();
    });

    this.videoService.duration$.subscribe(duration => {
      this.duration = duration;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.videoService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
      this.cdr.detectChanges();
    });

    this.videoService.fullscreenRequest$.subscribe(fullscreenRequest => {
      this.fullscreenRequest = fullscreenRequest;
      this.cdr.detectChanges();
    });
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
   * A videó hangerejének szabályozása.
   * @param value - Hangerő.
   */
  setVolume(value: string): void {
    this.volumePercentage = Number(value);
    this.videoService.setVolume(this.volumePercentage);
  }

  /**
   * A videó némítása.
   */
  mute(): void {
    this.tempVolumePercentage = this.volumePercentage;
    this.volumePercentage = 0;
    this.videoService.setVolume(this.volumePercentage);
  }

  /**
   * A videó némításának visszavonása.
   */
  unMute(): void {
    this.volumePercentage = this.tempVolumePercentage;
    this.videoService.setVolume(this.volumePercentage);
  }

  /**
   * A videó jelenlegi idejének beállítása a progress bar-ra való kattintással.
   * @param event - Az egér kattintási eseménye a videó progress bar-ján.
   */
  setCurrentTime(event: MouseEvent): void {
    const progressBar = event.target as HTMLProgressElement;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.clientWidth;

    const newTime = (clickPosition / barWidth) * this.duration;
    this.currentTime = newTime;

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: this.currentTime }));
  }

  setNote(): void {

  }

  setSettings(): void {
    this.isSettings = !this.isSettings;
    this.videoService.setSettings(this.isSettings);
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  setFullscreen(): void {
    this.fullscreenRequest = !this.fullscreenRequest;
    this.videoService.setFullscreen(this.fullscreenRequest);
  }
}
