import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-video-navbar',
  standalone: false,
  templateUrl: './video-navbar.html',
  styleUrl: './video-navbar.sass',
})
export class VideoNavbar {
  @Input() isPlaying: boolean = false;
  @Output() togglePlay = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() forward = new EventEmitter<void>();

  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  onRewind(): void {
    this.rewind.emit();
  }

  onForward(): void {
    this.forward.emit();
  }

  onVolume(): void {

  }

  onNote(): void {

  }

  onSettings(): void {

  }

  onFullscreen(): void {
    
  }
}
