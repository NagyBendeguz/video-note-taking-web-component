import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Settings } from '../models/settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settingsSource = new BehaviorSubject<Settings>(new Settings());
  settings$ = this.settingsSource.asObservable();

  private playbackRateSource = new BehaviorSubject<number>(1);
  playbackRate$ = this.playbackRateSource.asObservable();

  private videoNavbarOffsetSource = new BehaviorSubject<boolean>(true);
  videoNavbarOffset$ = this.videoNavbarOffsetSource.asObservable();

  private isVisible = new BehaviorSubject<boolean>(false);

  getSettings(): Observable<Settings> {
    return this.settings$;
  }

  setSettings(settings: Settings): void {
    this.settingsSource.next(settings);
  }

  setPlaybackRate(speed: number): void {
    this.playbackRateSource.next(speed);
  }

  setVideoNavbarOffset(isOffset: boolean): void {
    this.videoNavbarOffsetSource.next(isOffset);
  }

  toggleSubtitles(): void {
    this.isVisible.next(!this.isVisible.value);
  }

  getSubtitleVisibility(): Observable<boolean> {
    return this.isVisible.asObservable();
  }
}
