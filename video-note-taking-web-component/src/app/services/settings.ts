import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private playbackRateSource = new BehaviorSubject<number>(1);
  playbackRate$ = this.playbackRateSource.asObservable();

  getPlaybackRate(): Observable<number> {
    return this.playbackRate$;
  }

  setPlaybackRate(speed: number): void {
    this.playbackRateSource.next(speed);
  }
}
