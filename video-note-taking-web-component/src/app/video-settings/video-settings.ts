import { Component } from '@angular/core';
import { SettingsService } from '../services/settings';

@Component({
  selector: 'app-video-settings',
  standalone: false,
  templateUrl: './video-settings.html',
  styleUrl: './video-settings.sass',
})
export class VideoSettings {
  playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  constructor (private settingsSerivce: SettingsService) {}

  changePlaybackSpeed(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const speed = parseFloat(target.value);
    this.settingsSerivce.setPlaybackRate(speed);
  }
}
