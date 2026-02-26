import { Component, Input } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';

@Component({
  selector: 'app-extended-view',
  standalone: false,
  templateUrl: './extended-view.html',
  styleUrl: './extended-view.sass',
})
export class ExtendedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView: boolean = true;

  constructor(public videoService: VideoService) {}

  editEntry(): void {

  }

  deleteEntry(): void {

  }

  closeExtendedView(): void {
    this.isExtendedView = !this.isExtendedView;
  }

  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
