import { Component } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { PdfService } from '../services/pdf';
import DOMPurify from 'dompurify';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';

@Component({
  selector: 'app-editing-view',
  standalone: false,
  templateUrl: './editing-view.html',
  styleUrl: './editing-view.sass',
})
export class EditingView {
  entry$!: Observable<Entry>;
  entryLocal: Entry = new Entry();
  currentEntryId: number = 0;
  editMode: boolean = false;
  private note: any[] = [];
  settingsLocal: Settings = new Settings();
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
      this.entryLocal = currentEntry;
    });

    this.entryService.editEntry$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentEditEntry => {
      if (currentEditEntry.entryId !== 0)
      {
        this.editMode = true;
        this.entryLocal = {...currentEditEntry};
        this.entryService.setEntry(this.entryLocal);
      }
    });

    this.videoService.currentTime$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentTime => {
      this.entryLocal.timestamp = this.formatVideoTimestamp(currentTime);
      this.entryService.setEntry(this.entryLocal);
    });

    this.videoService.thumbnail$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentThumbnail => {
      this.entryLocal.thumbnail = currentThumbnail;
      this.entryService.setEntry(this.entryLocal);
    });

    this.entryService.getArrayEntry().pipe(takeUntil(this.unsubscribe$)).subscribe(currentNote => {
      this.note = currentNote;
    });

    this.settingsSerivce.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settingsLocal = currentSettings;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  editingRewind(): void {
    this.videoService.emitRewind(this.settingsLocal.thumbnailRewindRate);
  }

  editingForward(): void {
    this.videoService.emitForward(this.settingsLocal.thumbnailForwardRate);
  }

  addTitle(event: Event): void {
    const dirtyTitle = (event.target as HTMLInputElement).value;
    this.entryLocal.title = DOMPurify.sanitize(dirtyTitle);
  }

  addNote(event: Event): void {
    const dirtyNote = (event.target as HTMLInputElement).value;
    this.entryLocal.note = DOMPurify.sanitize(dirtyNote);
  }

  // TODO - inkonzisztens állapot a video-note.html/.sass mentésénél entryId az 1 lesz minden mentés után

  saveEntry(): void {
    if (this.editMode)
    {
      this.entryService.setArrayEntryById(this.entryLocal);
      this.editMode = false;
      this.entryService.setEditMode(false);
    }
    else if (this.entryLocal.title !== "" || this.entryLocal.note !== "")
    {
      this.currentEntryId++;
      this.entryLocal.entryId = this.currentEntryId;
      this.entryService.pushArrayEntry(this.entryLocal);
    }
    this.entryService.resetEntry(this.entryLocal);
  }

  /**
   * Törölni a jelenleg készülő bejegyzést.
   */
  cancelEntry(): void {
    if (this.entryLocal.title !== "" || this.entryLocal.note !== "")
    {
      this.entryService.resetEntry(this.entryLocal);
      this.entryService.setEditMode(false);
      this.entryLocal = new Entry();
    }
  }

  saveNote(): void {
    this.downloadJSON(this.note);
  }

  exportNote(): void {
    this.pdfService.generatePdf(this.note);
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
    a.download = "note.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
