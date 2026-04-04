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

  private isVisibleSource = new BehaviorSubject<boolean>(false);
  isVisible$ = this.isVisibleSource.asObservable();

  private videoForwardRateSource = new BehaviorSubject<number>(10);
  videoForwardRate$ = this.videoForwardRateSource.asObservable();

  private videoRewindRateSource = new BehaviorSubject<number>(10);
  videoRewindRate$ = this.videoRewindRateSource.asObservable();

  getSettings(): Observable<Settings> {
    return this.settings$;
  }

  setSettings(settings: Settings): void {
    this.settingsSource.next(settings);
  }

  setPlaybackRate(speed: number): void {
    this.playbackRateSource.next(speed);
  }

  getVideoForwardRate(): Observable<number> {
    return this.videoForwardRate$;
  }

  setVideoForwardRate(videoForwardRate: number): void {
    this.videoForwardRateSource.next(videoForwardRate);
  }

  getVideoRewindRate(): Observable<number> {
    return this.videoRewindRate$;
  }

  setVideoRewindRate(videoRewindRate: number): void {
    this.videoRewindRateSource.next(videoRewindRate);
  }

  getVideoNavbarOffset(): Observable<boolean> {
    return this.videoNavbarOffset$;
  }

  toggleVideoNavbarOffset(): void {
    this.videoNavbarOffsetSource.next(!this.videoNavbarOffsetSource.value);
  }

  toggleSubtitles(): void {
    this.isVisibleSource.next(!this.isVisibleSource.value);
  }

  toggleConvertInput(): void {
    const currentSettings = this.settingsSource.getValue();
    this.settingsSource.next({ ...currentSettings, convertInput: !currentSettings.convertInput });
  }

  updateThumbnailWidth(newThumbnailWidth: number): void {
    const currentSettings = this.settingsSource.getValue();
    this.settingsSource.next({ ...currentSettings, thumbnailWidth: newThumbnailWidth });
  }

  updateThumbnailHeight(newThumbnailHeight: number): void {
    const currentSettings = this.settingsSource.getValue();
    this.settingsSource.next({ ...currentSettings, thumbnailHeight: newThumbnailHeight });
  }
}
