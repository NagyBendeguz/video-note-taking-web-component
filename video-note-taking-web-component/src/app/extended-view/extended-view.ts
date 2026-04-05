import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Entry } from '../models/entry';
import { VideoService } from '../services/video';
import { EntryService } from '../services/entry';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { TranslateService } from '@ngx-translate/core';

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
  editMode: boolean = false;
  showModal: boolean = false;
  settings: Settings = new Settings();
  settings$!: Observable<Settings>;
  private unsubscribe$ = new Subject<void>();

  constructor(
    public videoService: VideoService,
    private entryService: EntryService,
    private settingsSerivce: SettingsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.editMode$ = this.entryService.getEditMode();

    this.entryService.editMode$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentEditMode => {
      this.editMode = currentEditMode;
    });

    this.settings$ = this.settingsSerivce.getSettings();

    this.settingsSerivce.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * A bejegyzés szerekesztése.
   */
  editEntry(): void {
    this.entryService.setEditEntry(this.entry);
    this.entryService.setEditMode(true);
  }

  /**
   * A bejegyzés törlésének kezdése, a megerősítő modal megnyitása.
   */
  deleteEntry(): void {
    if (!this.editMode && this.settings.confirmDelete)
    {
      this.showModal = true;
    }
    else
    {
      this.confirmDelete();
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

  /**
   * A törlés visszavonása a modal becsukásával.
   */
  cancelDelete(): void {
    this.showModal = false;
  }

  /**
   * A bővített nézet összecsukása tömörített nézetbe, ennek az emit-álása.
   */
  close(): void {
    this.onClose.emit();
  }

  /**
   * Az időbéllyegre kattintással a videó megfelelő pillanatára ugrani.
   */
  jumpToTimestamp(): void {
    this.videoService.setTimestamp(this.entry.timestamp);
    this.videoService.emitJumpToTimestamp();
  }
}
