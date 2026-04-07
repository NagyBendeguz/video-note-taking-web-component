import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private isPlayingSource = new BehaviorSubject<boolean>(false);
  isPlaying$ = this.isPlayingSource.asObservable();

  private volumeSource = new BehaviorSubject<number>(100);
  volume$ = this.volumeSource.asObservable();

  private durationSource = new BehaviorSubject<number>(0);
  duration$ = this.durationSource.asObservable();

  private currentTimeSource = new BehaviorSubject<number>(0);
  currentTime$ = this.currentTimeSource.asObservable();

  private isNoteSource = new BehaviorSubject<boolean>(false);
  isNote$ = this.isNoteSource.asObservable();

  private isSettingsSource = new BehaviorSubject<boolean>(false);
  isSettings$ = this.isSettingsSource.asObservable();

  private fullscreenRequestSource = new BehaviorSubject<boolean>(false);
  fullscreenRequest$ = this.fullscreenRequestSource.asObservable();

  private thumbnailSource = new BehaviorSubject<string>("");
  thumbnail$ = this.thumbnailSource.asObservable();

  private timestampSource = new BehaviorSubject<string>('00:00:00.000');
  timestamp$ = this.timestampSource.asObservable();

  togglePlay = new EventEmitter<void>();
  rewind = new EventEmitter<number>();
  forward = new EventEmitter<number>();
  jumpToTimestamp = new EventEmitter<void>();

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

  getNote(): Observable<boolean> {
    return this.isNote$;
  }

  setNote(isNote: boolean): void {
    this.isNoteSource.next(isNote);
  }

  getSettings(): Observable<boolean> {
    return this.isSettings$;
  }

  setSettings(isSettings: boolean): void {
    this.isSettingsSource.next(isSettings);
  }

  getFullscreen(): Observable<boolean> {
    return this.fullscreenRequest$;
  }

  setFullscreen(fullscreenRequest: boolean): void {
    this.fullscreenRequestSource.next(fullscreenRequest);
  }

  getThumbnail(): Observable<string> {
    return this.thumbnail$;
  }

  setThumbnail(thumbnail: string): void {
    this.thumbnailSource.next(thumbnail);
  }

  emitTogglePlay(): void {
    this.togglePlay.emit();
  }

  emitRewind(moveRate: number): void {
    this.rewind.emit(moveRate);
  }

  emitForward(moveRate: number): void {
    this.forward.emit(moveRate);
  }

  emitJumpToTimestamp(): void {
    this.jumpToTimestamp.emit();
  }

  getTimestamp(): Observable<string> {
    return this.timestamp$;
  }

  setTimestamp(timestamp: string): void {
    this.timestampSource.next(timestamp);
  }
}
