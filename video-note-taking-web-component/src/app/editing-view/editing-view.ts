import { Component } from '@angular/core';
import { Observable } from 'rxjs';
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
  entry$: Observable<Entry> = new Observable<Entry>();
  entryLocal: Entry = new Entry();
  arrayEntry$: Observable<Array<Entry>> = new Observable<Array<Entry>>();

  constructor(private entryService: EntryService, private videoService: VideoService) {}

  ngOnInit(): void {
    this.entry$ = this.entryService.getEntry();

    this.entryService.entry$.subscribe(currentEntry => {
      this.entryLocal = currentEntry;
    });

    this.arrayEntry$ = this.entryService.getArrayEntry();

    this.videoService.currentTime$.subscribe(currentTime => {
      this.entryLocal.timestamp = this.formatVideoTimestamp(currentTime);
      this.entryService.setEntry(this.entryLocal);
    });

    this.videoService.thumbnail$.subscribe(currentThumbnail => {
      this.entryLocal.thumbnail = currentThumbnail;
      this.entryService.setEntry(this.entryLocal);
    });
  }

  editingRewind(): void {

  }

  editingForward(): void {

  }

  addTitle(event: Event): void {
    this.entryLocal.title = (event.target as HTMLInputElement).value;
    this.entryService.setEntry(this.entryLocal);
  }

  addNote(event: Event): void {
    this.entryLocal.note = (event.target as HTMLInputElement).value;
    this.entryService.setEntry(this.entryLocal);
  }

  saveEntry(): void {
    
  }

  cancelEntry(): void {
    this.resetCurrentEntry();
  }

  saveNote(): void {

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
    this.entryLocal.timestamp = "00:00";
    this.entryLocal.note = "";
    this.entryService.setEntry(this.entryLocal);
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
}
