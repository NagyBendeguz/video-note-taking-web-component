import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';
import { EntryService } from '../services/entry';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-extended-view',
  standalone: false,
  templateUrl: './extended-view.html',
  styleUrl: './extended-view.sass',
})
export class ExtendedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView!: boolean;
  @Output() onClose = new EventEmitter<void>();
  arrayEntry$: BehaviorSubject<Entry[]> = new BehaviorSubject<Entry[]>([]);
  isExtendedViews: Map<string, boolean> = new Map();
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

  /**
   * Bejegyzés törlése.
   */
  confirmDelete(): void {
    // Jelenlegi bejegyzések és a törölni kívánt index.
    const currentEntries = this.arrayEntry$.getValue();
    const index = currentEntries.findIndex(entry => entry.entryId === this.entry.entryId);

    // Bejegyzés törlése a servce-ben és az isExtendedViews-ban.
    this.entryService.deleteById(this.entry);
    this.isExtendedViews.delete(this.entry.entryId + '');

    // A listából kivenni a törölt elemet majd emit-álni.
    currentEntries.splice(index, 1);
    this.arrayEntry$.next(currentEntries);

    // Modal becsukása.
    this.cancelDelete();
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
