import { Component } from '@angular/core';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { Observable, Subject, takeUntil } from 'rxjs';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-video-settings',
  standalone: false,
  templateUrl: './video-settings.html',
  styleUrl: './video-settings.sass',
})
export class VideoSettings {
  settings$!: Observable<Settings>;
  settingsLocal: Settings = new Settings();
  playbackSpeeds: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  isSubtitleVisible: boolean = false;
  isOffsetNegative: boolean = true;
  private unsubscribe$ = new Subject<void>();

  constructor (private settingsSerivce: SettingsService) {}

  ngOnInit(): void {
    this.settings$ = this.settingsSerivce.getSettings();

    this.settingsSerivce.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settingsLocal = currentSettings;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  changePlaybackSpeed(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const speed = parseFloat(target.value);
    this.settingsSerivce.setPlaybackRate(speed);
  }

  toggleSubtitles(): void {
    this.settingsSerivce.toggleSubtitles();
    this.isSubtitleVisible = !this.isSubtitleVisible;
  }

  toggleOffset(): void {
    const value = this.isOffsetNegative ? "0px" : "-65px";
    document.documentElement.style.setProperty("--video-navbar-offset", value);
    this.isOffsetNegative = !this.isOffsetNegative;
  }

  setThumbnailForwardRate(event: Event): void {
    const dirtyThumbnailForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailForwardRate));

    // Ellenőrizni, hogy a bemenet egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settingsLocal.thumbnailForwardRate = 1;
    }
    else
    {
      this.settingsLocal.thumbnailForwardRate = sanitizedValue;
    }
  }

  setThumbnailRewindRate(event: Event): void {
    const dirtyThumbnailRewindRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailRewindRate));

    // Ellenőrizni, hogy a bemenet egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settingsLocal.thumbnailRewindRate = 1;
    }
    else
    {
      this.settingsLocal.thumbnailRewindRate = sanitizedValue;
    }
  }
}
