import { Component, Input } from '@angular/core';
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
  @Input() isExtendedView: boolean = false;

  constructor(public videoService: VideoService) {}

  openExtendedView(): void {
    this.isExtendedView = !this.isExtendedView;
  }

  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
