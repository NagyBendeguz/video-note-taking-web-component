import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private playbackRateSource = new BehaviorSubject<number>(1);
  playbackRate$ = this.playbackRateSource.asObservable();

  private isVisible = new BehaviorSubject<boolean>(false);

  setPlaybackRate(speed: number): void {
    this.playbackRateSource.next(speed);
  }

  toggleSubtitles(): void {
    this.isVisible.next(!this.isVisible.value);
  }

  getSubtitleVisibility(): Observable<boolean> {
    return this.isVisible.asObservable();
  }
}
