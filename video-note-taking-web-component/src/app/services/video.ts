import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Video {
  private isPlayingSource = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSource.asObservable();

  private volumeSource = new BehaviorSubject<number>(100);
  volume$ = this.volumeSource.asObservable();

  private isFullscreenSource = new BehaviorSubject<boolean>(false);
  isFullscreen$ = this.isFullscreenSource.asObservable();

  setPlaying(playing: boolean): void {
    this.isPlayingSource.next(playing);
  }

  setVolume(volume: number): void {
    this.volumeSource.next(volume);
  }

  setFullscreen(fullscreen: boolean): void {
    this.isFullscreenSource.next(fullscreen);
  }
}
