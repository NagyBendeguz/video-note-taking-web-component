import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';
import { EntryService } from '../services/entry';
import { Observable, Subject, takeUntil } from 'rxjs';

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
  editMode$!: Observable<boolean>;
  editModeLocal: boolean = false;
  showModal: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(public videoService: VideoService, private entryService: EntryService) {}

  ngOnInit(): void {
    this.editMode$ = this.entryService.getEditMode();

    this.entryService.editMode$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentEditMode => {
      this.editModeLocal = currentEditMode;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  editEntry(): void {
    this.entryService.setEditEntry(this.entry);
    this.entryService.setEditMode(true);
  }

  deleteEntry(): void {
    if (!this.editModeLocal)
    {
      this.showModal = true;
    }
  }

  confirmDelete(): void {
    this.entryService.deleteById(this.entry);
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
