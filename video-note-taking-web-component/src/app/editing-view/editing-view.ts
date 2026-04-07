import { Component, ElementRef, ViewChild } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { PdfService } from '../services/pdf';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-editing-view',
  standalone: false,
  templateUrl: './editing-view.html',
  styleUrl: './editing-view.sass',
})
export class EditingView {
  @ViewChild('inputTitle') inputTitle!: ElementRef<HTMLInputElement>;
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
    private pdfService: PdfService,
    private translate: TranslateService
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

  ngAfterViewInit(): void {
    this.videoService.isNote$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsNote => {
      if (currentIsNote)
      {
        setTimeout(() => this.inputTitle.nativeElement.focus());
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * A thumbnail időbeli előre mozgatása.
   */
  editingRewind(): void {
    this.videoService.emitRewind(this.settings.thumbnailRewindRate);
  }

  /**
   * A thumbnail időbeli hátra mozgatása.
   */
  editingForward(): void {
    this.videoService.emitForward(this.settings.thumbnailForwardRate);
  }

  /**
   * A jelenlegi bejegyzés címének tisztítása és hozzáadása a jelenlegi bejegyzéshez.
   * @param event - Az input element-nek a event-je.
   */
  addTitle(event: Event): void {
    const dirtyTitle = (event.target as HTMLInputElement).value;
    if (dirtyTitle.length <= 50)
    {
      this.entry.title = DOMPurify.sanitize(dirtyTitle);
    }
  }

  /**
   * A jelenlegi bejegyzés tartalmának hozzáadása a jelenlegi bejegyzéshez.
   * @param event - Az input element-nek a event-je.
   */
  addNote(event: Event): void {
    const dirtyNote = (event.target as HTMLInputElement).value;

    this.addNoteFormat(dirtyNote);
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

  /**
   * Félkövér formázás.
   */
  bold(): void {
    this.modifyText('**', '**');
  }

  /**
   * Dőlt formázás.
   */
  italic(): void {
    this.modifyText('_', '_');
  }

  /**
   * Áthúzott formázás.
   */
  strikethrough(): void {
    this.modifyText('~~', '~~');
  }

  /**
   * Számozott lista formázás.
   */
  orderedList(): void {
    this.modifyText(`\n${this.currentOrderedListNumber}. `, '\n');
    this.currentOrderedListNumber++;
  }

  /**
   * Felsorolás formázás.
   */
  unorderedList(): void {
    this.modifyText('\n- ', '\n');
  }

  /**
   * Táblázat formázás.
   */
  /*table(): void {
    this.modifyText('\n| Header | Header |\n| --- | --- |\n| ', 'Cell | Cell |');
  }*/

  /**
   * A markdown szintaxis gombokkal való hozzáadása a kijeleölt szöveghez.
   * Ha nincsen kijelölve semmi akkor szimplán a legenerálja a megfelelő karaktereket.
   * @param start - A kijelölt szöveg elő beszúrabdó karakterek.
   * @param end - A kijelölt szöveg mögé beszurandó karakterek.
   */
  private modifyText(start: string, end: string): void {
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
   * A bejegyzés tisztítása és átalakítása markdown szintaxisból formázás nélküli illetve HTML formátumba.
   * @param currentNote - A jelenlegi bejegyzés tartalma.
   */
  private addNoteFormat(currentNote: string): void {
    const cleanedNoteWithMD = DOMPurify.sanitize(currentNote);

    this.entry.note = this.cleanNoteFromMD(cleanedNoteWithMD);
    this.entry.noteWithBr = this.convertNewlinesToBr(this.cleanNoteFromMD(cleanedNoteWithMD));
    this.entry.formattedNoteMD = cleanedNoteWithMD;
    this.formatNote(this.entry.formattedNoteMD);
  }

  /**
   * Eltünteti a markdown formázást a bejegyzés tartalmából.
   * @param cleanedNoteWithMD - A tisztított bejegyzés tartalma markdown szintaxisban.
   * @returns - A markdown szintaxis nélküli bejegyzés tartalma.
   */
  private cleanNoteFromMD(cleanedNoteWithMD: string): string {
    const cleanedNoteWithoutMD = cleanedNoteWithMD
                                  .replace(/(\*\*|__)(.*?)\1/g, '$2') // Félkövér.
                                  .replace(/(\*|_)(.*?)\1/g, '$2') // Dőlt.
                                  .replace(/~~(.*?)~~/g, '$1') // Áthúzott.
                                  .replace(/`([^`]+)`/g, '$1'); // Beágyazott.

    return cleanedNoteWithoutMD;
  }

  /**
   * Átalakítja a Marked JavaScript könyvtár segítségével a markdown szintaxist HTML formátumba.
   * @param formattedNoteMD - A bejegyzés tartalma markdown szintaxisban.
   */
  private async formatNote(formattedNoteMD: string): Promise<void> {
    let formattedNoteHTML = await marked(formattedNoteMD);
    formattedNoteHTML = this.cleanNoteHTML(formattedNoteHTML);
    this.entry.formattedNoteHTML = this.convertNewlinesToBr(formattedNoteHTML);
  }

  /**
   * Eltávolítani a listaelemek előtt és után található felesleges <br> tag-eket.
   * @param noteHTML - A HTML formátumban található bejegyzés tartalma.
   * @returns - A HTML formátumó bejegyzés tartalma a felesleges <br> tag-ek nélkül.
   */
  private cleanNoteHTML(noteHTML: string): string {
    return noteHTML
      .replace(/<br\s*\/?>/g, ' ') // Eltávolítani minden <br> tag-et, és kicserélni szóközre.
      .replace(/(<li>.*?)<\/li>/g, (match) => match.replace(/\s*<br\s*\/?>\s*/g, '') ) // Eltávolítani <br> tag-eket a <li> tag-ekben.
      .replace(/>\s+</g, '> <'); // Megtisztítani a HTML tag-ekben található üres helyeket.
  }

  /**
   * A listaelemeket kivéve az új sorokat <br> tag-eké alakítani.
   * @param noteHTML - A HTML formátumban található bejegyzés tartalma.
   * @returns - A HTML formátumó bejegyzés tartalma a <br> tag-eket használva \n helyett.
   */
  private convertNewlinesToBr(noteHTML: string): string {
    const lines = noteHTML.split(/<\/li>\s*(<li>|<\/ol>|<\/ul>)/);
    return lines.map(line =>
    {
      if (line.startsWith('<li>') || line.endsWith('</li>'))
      {
        return line;
      }
      return line.replace(/\n/g, '<br>');
    }).join('');
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
