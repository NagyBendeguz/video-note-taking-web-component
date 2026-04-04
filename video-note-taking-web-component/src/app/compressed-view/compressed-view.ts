import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-compressed-view',
  standalone: false,
  templateUrl: './compressed-view.html',
  styleUrl: './compressed-view.sass',
})
export class CompressedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView!: boolean;
  @Output() onToggle = new EventEmitter<void>();
  settings$!: Observable<Settings>;

  constructor(
    private videoService: VideoService,
    private settingsSerivce: SettingsService
  ) {}

  ngOnInit(): void {
    this.settings$ = this.settingsSerivce.getSettings();
  }

  toggle(): void {
    this.onToggle.emit();
  }

  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
