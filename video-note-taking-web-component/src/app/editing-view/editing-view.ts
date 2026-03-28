import { Component } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { PdfService } from '../services/pdf';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-editing-view',
  standalone: false,
  templateUrl: './editing-view.html',
  styleUrl: './editing-view.sass',
})
export class EditingView {
  entry$!: Observable<Entry>;
  entry: Entry = new Entry();
  private currentEntryId!: number;
  editMode: boolean = false;
  private note: any[] = [];
  settings: Settings = new Settings();
  showModal: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private entryService: EntryService,
    private videoService: VideoService,
    private settingsSerivce: SettingsService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.entry$ = this.entryService.getEntry();

    this.entryService.entry$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentEntry => {
      this.entry = currentEntry;
    });

    this.entryService.editEntry$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentEditEntry => {
      if (currentEditEntry.entryId !== 0)
      {
        this.editMode = true;
        this.entry = {...currentEditEntry};
        this.entryService.setEntry(this.entry);
      }
    });

    this.videoService.currentTime$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentTime => {
      this.entry.timestamp = this.formatVideoTimestamp(currentTime);
      this.entryService.setEntry(this.entry);
    });

    this.videoService.thumbnail$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentThumbnail => {
      this.entry.thumbnail = currentThumbnail;
      this.entryService.setEntry(this.entry);
    });

    this.entryService.getArrayEntry().pipe(takeUntil(this.unsubscribe$)).subscribe(currentNote => {
      this.note = currentNote;
    });

    this.settingsSerivce.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;
    });

    this.entryService.currentEntryId$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentCurrentEntryId => {
      this.currentEntryId = currentCurrentEntryId;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  editingRewind(): void {
    this.videoService.emitRewind(this.settings.thumbnailRewindRate);
  }

  editingForward(): void {
    this.videoService.emitForward(this.settings.thumbnailForwardRate);
  }

  addTitle(event: Event): void {
    const dirtyTitle = (event.target as HTMLInputElement).value;
    if (dirtyTitle.length <= 50)
    {
      this.entry.title = DOMPurify.sanitize(dirtyTitle);
    }
  }

  addNote(event: Event): void {
    const dirtyNote = (event.target as HTMLInputElement).value;
    this.entry.note = DOMPurify.sanitize(dirtyNote);
  }

  // TODO - inkonzisztens állapot a video-note.html/.sass mentésénél entryId az 1 lesz minden mentés után

  /**
   * A jelenlegi bejegyzés mentése.
   */
  saveEntry(): void {
    if (this.editMode)
    {
      this.entryService.setArrayEntryById(this.entry);
      this.editMode = false;
      this.entryService.setEditMode(false);
    }
    else if (this.entry.title !== '' || this.entry.note !== '')
    {
      this.currentEntryId++;
      this.entry.entryId = this.currentEntryId;
      this.entryService.pushArrayEntry(this.entry);
      this.entryService.setCurrentEntryId(this.currentEntryId);
    }
    this.entryService.resetEntry(this.entry);
  }

  /**
   * A leendő bejegyzés elvetésének kezdése, a megerősítő modal megnyitása beállítástól függően.
   */
  cancelEntry(): void {
    if (this.settings.confirmCancel)
    {
      this.showModal = true;
    }
    else
    {
      this.confirmCancel();
    }
  }

  /**
   * Törölni a jelenleg készülő bejegyzést.
   */
  confirmCancel(): void {
    if (this.entry.title !== '' || this.entry.note !== '')
    {
      this.editMode = false;
      this.entryService.setEditMode(false);
      this.entry = new Entry(this.entry.timestamp, this.entry.thumbnail);
      this.entryService.resetEntry(this.entry);
    }

    this.cancelCancel();
  }

  /**
   * A mégse visszavonása a megerősítő modal becsukásával.
   */
  cancelCancel(): void {
    this.showModal = false;
  }

  /**
   * A jegyzet mentése JSON fájlba.
   */
  saveNote(): void {
    this.downloadJSON(this.note);
  }

  /**
   * A jegyzet exportálása PDF fájlba.
   */
  exportNote(): void {
    this.pdfService.generatePDF(this.note);
  }

  bold(): void {

  }

  italic(): void {

  }

  underline(): void {

  }

  strikethrough(): void {

  }

  orderedList(): void {

  }

  unorderedList(): void {

  }

  table(): void {

  }

  /**
   * Óra, perc, másodperc és ezredmásodperc kiszámolása és formázása.
   * @param currentTime - A formázatlan jelenlegi idő.
   * @returns - A kiszámolt és formázott jelenlegi idő.
   */
  private formatVideoTimestamp(currentTime: number): string {
    const hours = Math.floor(currentTime / 3600);
    const minutes = Math.floor((currentTime % 3600) / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime - Math.floor(currentTime)) * 1000);

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
  }

  /**
   * A jegyzet mentése JSON fájlba.
   * @param data - A jelenlegi mentésre kerülő jegyzet.
   */
  private downloadJSON(data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'note.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
