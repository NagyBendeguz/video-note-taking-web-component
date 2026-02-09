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
  fullscreenRequest: boolean = false;
  duration: number = 0;
  currentTime: number = 0;

  constructor(private cdr: ChangeDetectorRef, public videoService: Video) {}

  ngOnInit() {
    document.addEventListener('videoTimeUpdate', (event: CustomEvent) => {
      this.currentTime = event.detail;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.videoService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });

    this.videoService.fullscreenRequest$.subscribe(fullscreenRequest => {
      this.fullscreenRequest = fullscreenRequest;
    });

    this.videoService.duration$.subscribe(duration => {
      this.duration = duration;
    });

    /*this.videoService.currentTime$.subscribe(currentTime => {
      this.currentTime = currentTime;
    });*/
  }

  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  onRewind(): void {
    this.rewind.emit();
  }

  onForward(): void {
    this.forward.emit();
  }

  setVolume(value: string): void {
    this.volumePercentage = Number(value);
    this.videoService.setVolume(this.volumePercentage);
  }

  mute(): void {
    this.tempVolumePercentage = this.volumePercentage;
    this.volumePercentage = 0;
    this.videoService.setVolume(this.volumePercentage);
  }

  unMute(): void {
    this.volumePercentage = this.tempVolumePercentage;
    this.videoService.setVolume(this.volumePercentage);
  }

  setCurrentTime(event: MouseEvent): void {
    const progressBar = event.target as HTMLProgressElement;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.clientWidth;

    const newTime = (clickPosition / barWidth) * this.duration;

    this.currentTime = newTime;

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: this.currentTime }));
  }

  onNote(): void {

  }

  onSettings(): void {

  }

  setFullscreen(): void {
    this.fullscreenRequest = !this.fullscreenRequest;
    this.videoService.setFullscreen(this.fullscreenRequest);
  }
}
