import { Component, EventEmitter, Output } from '@angular/core';
import { Video } from '../services/video';

@Component({
  selector: 'app-video-navbar',
  standalone: false,
  templateUrl: './video-navbar.html',
  styleUrl: './video-navbar.sass',
})
export class VideoNavbar {
  isPlaying: boolean = false;
  volumePercentage: number = 100;
  @Output() togglePlay = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() forward = new EventEmitter<void>();

  constructor(public videoService: Video) {}

  ngAfterViewInit(): void {
    this.videoService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });
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

  onNote(): void {

  }

  onSettings(): void {

  }

  onFullscreen(): void {
    
  }
}
