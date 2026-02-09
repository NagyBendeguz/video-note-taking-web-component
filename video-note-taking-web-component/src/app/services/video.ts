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

  private fullscreenRequestSource = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = this.fullscreenRequestSource.asObservable();

  private durationSource = new BehaviorSubject<number>(0);
  duration$ = this.durationSource.asObservable();

  private currentTimeSource = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSource.asObservable();

  setPlaying(playing: boolean): void {
    this.isPlayingSource.next(playing);
  }

  setVolume(volume: number): void {
    this.volumeSource.next(volume);
  }

  setFullscreen(fullscreenRequest: boolean): void {
    this.fullscreenRequestSource.next(fullscreenRequest);
  }

  setDuration(duration: number): void {
    this.durationSource.next(duration);
  }

  setCurrentTime(currentTime: number): void {
    this.currentTimeSource.next(currentTime);
  }
}
