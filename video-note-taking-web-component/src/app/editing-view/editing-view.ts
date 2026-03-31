import { Component } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { PdfService } from '../services/pdf';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

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
  private currentOrderedListNumber: number = 1;
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

    this.addNoteFormat(dirtyNote);
  }

  private addNoteFormat(currentNote: string): void {
    const cleanedNoteWithMD = DOMPurify.sanitize(currentNote);

    this.entry.note = this.cleanNoteFromMD(cleanedNoteWithMD);
    this.entry.formattedNoteMD = cleanedNoteWithMD;
    this.formatNote(this.entry.formattedNoteMD);
  }

  private cleanNoteFromMD(cleanedNoteWithMD: string): string {
    const cleanedNoteWithoutMD = cleanedNoteWithMD
                                  .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
                                  .replace(/(\*|_)(.*?)\1/g, '$2') // italic
                                  .replace(/~~(.*?)~~/g, '$1') // strikethrough
                                  .replace(/`([^`]+)`/g, '$1'); // inline

    return cleanedNoteWithoutMD;
  }

  private async formatNote(formattedNoteMD: string): Promise<void> {
    let formattedNoteHTML = await marked(formattedNoteMD);
    formattedNoteHTML = this.cleanNoteHTML(formattedNoteHTML);
    this.entry.formattedNoteHTML = this.convertNewlinesToBr(formattedNoteHTML);
  }

  private cleanNoteHTML(noteHTML: string): string {
    // Eltávolítani a listaelemek előtt és után található felesleges <br> tag-eket.
    return noteHTML
      .replace(/<br\s*\/?>/g, ' ') // Eltávolítani minden <br> tag-et, és kicserélni szóközre.
      .replace(/(<li>.*?)<\/li>/g, (match) => match.replace(/\s*<br\s*\/?>\s*/g, '') ) // Eltávolítani <br> tag-eket a <li> tag-ekben.
      .replace(/>\s+</g, '> <'); // Megtisztítani a a HTML tag-ekben található üres helyeket.
  }

  private convertNewlinesToBr(noteHTML: string): string {
    // A lista elemeket kivéve az új sorokat <br> tag-eké alakítani.
    const lines = noteHTML.split(/<\/li>\s*(<li>|<\/ol>|<\/ul>)/);
    return lines.map(line => {
      if (line.startsWith('<li>') || line.endsWith('</li>')) {
        return line;
      }
      return line.replace(/\n/g, '<br>');
    }).join('');
  }

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
    this.currentOrderedListNumber = 1;
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
    this.modifyText('**', '**');
  }

  italic(): void {
    this.modifyText('_', '_');
  }

  strikethrough(): void {
    this.modifyText('~~', '~~');
  }

  orderedList(): void {
    this.modifyText(`\n${this.currentOrderedListNumber}. `, '\n');
    this.currentOrderedListNumber++;
  }

  unorderedList(): void {
    this.modifyText('\n- ', '\n');
  }

  table(): void {
    this.modifyText('\n| Header | Header |\n| --- | --- |\n| ', 'Cell | Cell |');
  }

  modifyText(start: string, end: string): void {
    const textarea = document.getElementById('note') as HTMLTextAreaElement;
    // A kurzor aktuális pozíciója.
    const cursorPos = textarea.selectionStart;
    // A kiválasztás végső pozíciója.
    const endPos = textarea.selectionEnd;
    // Ki van-e jelölve szöveg.
    const isTextSelected = cursorPos !== endPos;

    // A kurzor előtt található szöveg.
    let textBefore = this.entry.formattedNoteMD.substring(0, cursorPos);
    // A kurzor után található szöveg.
    let textAfter = this.entry.formattedNoteMD.substring(endPos);

    let selectedText = '';

    // Ha van kijelölt szöveg, akkor a kiválasztott szöveg beillesztésre kerül a start és end karakterek közé.
    if (isTextSelected)
    {
      selectedText = this.entry.formattedNoteMD.substring(cursorPos, endPos);
      // A kijelölt szöveg tördelése.
      this.entry.formattedNoteMD = textBefore + start + selectedText + end + textAfter;
    }
    // Ha nincs kijelölt szöveg, a formázási karakterek a kurzor pozíciójára kerülnek.
    else
    {
      // Formázási karakterek beszúrása a kurzor helyére.
      this.entry.formattedNoteMD = textBefore + start + end + textAfter;
    }

    // Frissíteni a textarea-t az új formázott jegyzettel.
    textarea.value = this.entry.formattedNoteMD;
    // A kurzor maradjon ugyanott, ahol eredetileg volt.
    textarea.selectionStart = cursorPos + (isTextSelected ? start.length + selectedText.length + end.length : start.length); 
    // Az új kurzorpozíció kezdőpontját és végpontját ugyanarra az értékre beállítani.
    textarea.selectionEnd = textarea.selectionStart;
    textarea.focus();

    this.addNoteFormat(this.entry.formattedNoteMD);
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
