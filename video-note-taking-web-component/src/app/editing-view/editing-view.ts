import { Component } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';

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
  private unsubscribe$ = new Subject<void>();

  constructor(private entryService: EntryService, private videoService: VideoService) {}

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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  editingRewind(): void {
    this.videoService.emitRewind();
  }

  editingForward(): void {
    this.videoService.emitForward();
  }

  addTitle(event: Event): void {
    this.entryLocal.title = (event.target as HTMLInputElement).value;
  }

  addNote(event: Event): void {
    this.entryLocal.note = (event.target as HTMLInputElement).value;
  }

  // TODO - inkonzisztens állapot a video-note.html mentésénél éppen a mentés után a reset alap állapotban van

  saveEntry(): void {
    if (this.editMode)
    {
      this.entryService.setArrayEntryById(this.entryLocal);
      this.editMode = false;
    }
    else
    {
      this.currentEntryId++;
      this.entryLocal.entryId = this.currentEntryId;
      this.entryService.pushArrayEntry(this.entryLocal);
    }
    this.entryService.resetEntry();
  }

  cancelEntry(): void {
    this.resetCurrentEntry();
  }

  saveNote(): void {
    this.downloadJSON(this.note);
  }

  exportNote(): void {

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
   * Törölni a jelenleg készülő bejegyzést.
   */
  private resetCurrentEntry(): void {
    this.entryLocal.entryId = 0;
    this.entryLocal.title = "";
    this.entryLocal.thumbnail = "image.svg";
    this.entryLocal.timestamp = "00:00:00.000";
    this.entryLocal.note = "";
    this.entryService.resetEntry();
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
