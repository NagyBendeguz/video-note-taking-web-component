import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';
import { EntryService } from '../services/entry';

@Component({
  selector: 'app-extended-view',
  standalone: false,
  templateUrl: './extended-view.html',
  styleUrl: './extended-view.sass',
})
export class ExtendedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView: boolean = true;
  @Output() onClose = new EventEmitter<void>();
  showModal = false;

  constructor(public videoService: VideoService, private entryService: EntryService) {}

  editEntry(): void {
    this.entryService.setEditEntry(this.entry);
  }

  deleteEntry(): void {
    this.showModal = true;
  }

  confirmDelete(): void {
    this.entryService.deleteById(this.entry.entryId);
    this.showModal = false;
  }

  cancelDelete(): void {
    this.showModal = false;
  }

  close() {
    this.onClose.emit();
  }

  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
