import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';

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

  constructor(public videoService: VideoService) {}

  toggle() {
    this.onToggle.emit();
  }

  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
