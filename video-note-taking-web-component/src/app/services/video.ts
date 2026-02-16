import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Video {
  private isPlayingSource = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSource.asObservable();

  private volumeSource = new BehaviorSubject<number>(100);
  volume$ = this.volumeSource.asObservable();

  private durationSource = new BehaviorSubject<number>(0);
  duration$ = this.durationSource.asObservable();

  private currentTimeSource = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSource.asObservable();

  private isSettingsSource = new BehaviorSubject<boolean>(false);
  isSettings$ = this.isSettingsSource.asObservable();

  private fullscreenRequestSource = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = this.fullscreenRequestSource.asObservable();

  getPlaying(): Observable<boolean> {
    return this.isPlaying$;
  }

  setPlaying(playing: boolean): void {
    this.isPlayingSource.next(playing);
  }

  getVolume(): Observable<number> {
    return this.volume$;
  }

  setVolume(volume: number): void {
    this.volumeSource.next(volume);
  }

  getDuration(): Observable<number> {
    return this.duration$;
  }

  setDuration(duration: number): void {
    this.durationSource.next(duration);
  }

  getCurrentTime(): Observable<number> {
    return this.currentTime$;
  }

  setCurrentTime(currentTime: number): void {
    this.currentTimeSource.next(currentTime);
  }

  getSettings(): Observable<boolean> {
    return this.isSettings$;
  }

  setSettings(isSettings: boolean): void {
    this.isSettingsSource.next(isSettings);
  }

  getFullscreen(): Observable<boolean> {
    return this. fullscreenRequest$;
  }

  setFullscreen(fullscreenRequest: boolean): void {
    this.fullscreenRequestSource.next(fullscreenRequest);
  }
}
