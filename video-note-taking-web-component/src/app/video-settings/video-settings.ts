import { Component } from '@angular/core';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { Observable, Subject, takeUntil } from 'rxjs';
import { EntryService } from '../services/entry';
import { VideoService } from '../services/video';
import { TranslateService } from '@ngx-translate/core';
import Ajv from 'ajv';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-video-settings',
  standalone: false,
  templateUrl: './video-settings.html',
  styleUrl: './video-settings.sass',
})
export class VideoSettings {
  settings$!: Observable<Settings>;
  settings: Settings = new Settings();
  playbackSpeeds: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  isSubtitleVisible: boolean = false;
  isOffsetNegative$!: Observable<boolean>;
  videoForwardRate$!: Observable<number>;
  videoRewindRate$!: Observable<number>;
  isFullscreen$!: Observable<boolean>;
  private isFullscreen!: boolean;
  private unsubscribe$ = new Subject<void>();
  private ajv = new Ajv();
  private helpOpen: Record<string, boolean> = {};

  // A betölteni kívánt JSON fájl struktúrája.
  private jsonSchema = {
    oneOf: [
      // Beállítások nélküli struktúra.
      {
        type: "array",
        items: { $ref: "#/definitions/entry" }
      },

      // Beállításokkal a struktúra.
      {
        type: "object",
        properties: {
          settings: {
            type: "object",
            properties: {
              language: { type: "string" },
              theme: { type: "string" },
              saveSettings: { type: "boolean" },
              convertInput: { type: "boolean" },
              confirmCancel: { type: "boolean" },
              confirmDelete: { type: "boolean" },
              stopVideoOnNote: { type: "boolean" },
              startVideoOnSave: { type: "boolean" },
              thumbnailQualityPercentage: { type: "integer" },
              thumbnailWidth: { type: "integer" },
              thumbnailHeight: { type: "integer" },
              thumbnailForwardRate: { type: "number" },
              thumbnailRewindRate: { type: "number" },
              shortcuts: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            },
            required: ["language", "theme"],
            additionalProperties: false
          },
          entries: {
            type: "array",
            items: { $ref: "#/definitions/entry" }
          }
        },
        required: ["entries"],
        additionalProperties: false
      }
    ],

    definitions: {
      entry: {
        type: "object",
        properties: {
          entryId: { type: "integer" },
          title: { type: "string" },
          timestamp: { type: "string" },
          note: { type: "string" },
          noteWithBr: { type: "string" },
          formattedNoteHTML: { type: "string" },
          formattedNoteMD: { type: "string" },
          thumbnail: { type: "string" }
        },
        required: ["entryId", "title", "timestamp", "note", "thumbnail"],
        additionalProperties: false
      }
    }
  };

  // A beállítható nyelvek.
  langs = [
    { code: 'en', label: 'English' },
    { code: 'hu', label: 'Magyar' }
  ];

  constructor (
    private settingsService: SettingsService,
    private entryService: EntryService,
    private videoService: VideoService,
    private translate: TranslateService
  ) {
    translate.addLangs(this.langs.map(l => l.code));
    translate.setFallbackLang('en');
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings();

    this.settingsService.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;

      // Frissítse a nyelvet.
      this.translate.use(currentSettings.language);
    });

    this.isOffsetNegative$ = this.settingsService.getVideoNavbarOffset();

    this.settingsService.videoNavbarOffset$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVideoOffset => {
      this.changeOffset(currentVideoOffset);
    });

    this.isFullscreen$ = this.videoService.getFullscreen();

    this.videoService.fullscreenRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentFullscreenRequest => {
      this.isFullscreen = currentFullscreenRequest;
    });

    this.videoForwardRate$ = this.settingsService.getVideoForwardRate();
    this.videoRewindRate$ = this.settingsService.getVideoRewindRate();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * A kiválasztott JSON fájl betöltése.
   * @param event - A betölteni kívánt JSON fájl.
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length)
    {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) =>
      {
        try
        {
          const jsonData = JSON.parse(e.target?.result as string);
          
          // A JSON fájl struktúra ellenőrzése.
          const valid = this.ajv.validate(this.jsonSchema, jsonData);
          if (!valid)
          {
            console.error('Invalid JSON structure: ', this.ajv.errors);
            return;
          }

          // A JSON fájlban található minden bejegyzés tisztítása.
          const entriesArray = Array.isArray(jsonData)
            ? jsonData
            : Array.isArray((jsonData as any)?.entries)
              ? (jsonData as any).entries
              : [];

          const sanitizedData = entriesArray.map((entry: any) => this.sanitizeInput(entry));

          // Beállítás kinyerése ha van.
          const settings = !Array.isArray(jsonData) && (jsonData as any)?.settings && typeof (jsonData as any).settings === 'object'
          ? (jsonData as any).settings
          : undefined;

          // Ha van beállítás akkor állítsa be a beállításokat.
          if (settings)
          {
            this.settingsService.setSettings(settings);
          }

          // A megtisztított jegyzet betöltése.
          this.entryService.setArrayEntry(sanitizedData);

          // Megtalálni a legnagyobb bejegyzés id-t.
          const highestEntryId = sanitizedData.length
            ? Math.max(...sanitizedData.map((e: any) => Number.isFinite(e.entryId) ? e.entryId : 0))
            : 0;

          // A legnagyobb bejegyzés id-t beállítani a jelenlegi id-re, hogy innentől számítsa az új bejegyzésekhez az id-t.
          this.entryService.setCurrentEntryId(highestEntryId);
        }
        catch (error)
        {
          console.error('Error parsing JSON: ', error);
        }
      };

      reader.readAsText(file);
    }
  }

  /**
   * Beállítani a videó lejátszási sebességét.
   * @param event - A kívánt lejátszási sebesség.
   */
  changePlaybackSpeed(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const speed = parseFloat(target.value);
    this.settingsService.setPlaybackRate(speed);
  }

  /**
   * A videó vezérlősávjában az idő előretekerés mértékegységének változtatása.
   * @param event - A videó vezérlősávjában az idő előretekerésére beállítani kívánt mértékegység eseményként.
   */
  setVideoForwardRate(event: Event): void {
    const dirtyVideoForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyVideoForwardRate)) || 10;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0 || sanitizedValue > 10000)
    {
      this.settingsService.setVideoForwardRate(10);
    }
    else
    {
      this.settingsService.setVideoForwardRate(sanitizedValue);
    }
  }

  /**
   * A videó vezérlősávjában az idő hátratekerés mértékegységének változtatása.
   * @param event - A videó vezérlősávjában az idő hátratekerésére beállítani kívánt mértékegység eseményként.
   */
  setVideoRewindRate(event: Event): void {
    const dirtyVideoForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyVideoForwardRate)) || 10;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0 || sanitizedValue > 10000)
    {
      this.settingsService.setVideoRewindRate(10);
    }
    else
    {
      this.settingsService.setVideoRewindRate(sanitizedValue);
    }
  }

  /**
   * A videó feliratok ki és be kapcsolása.
   */
  toggleSubtitles(): void {
    this.settingsService.toggleSubtitles();
    this.isSubtitleVisible = !this.isSubtitleVisible;
  }

  /**
   * A videó vezérlősávjának a videóval való átfedésének ki és be kapcsolása.
   */
  toggleOffset(): void {
    if (!this.isFullscreen)
    {
      this.settingsService.toggleVideoNavbarOffset();
    }
  }

  /**
   * A nyelv beállítása.
   * @param event - A beállítandó nylev.
   */
  changeLang(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    this.settingsService.setLanguage(code);
    this.translate.use(code);
  }

  /**
   * A téma beállítása.
   * @param event - A beállítandó téma.
   */
  changeTheme(event: Event): void {
    const theme = (event.target as HTMLSelectElement).value;
    this.settingsService.setTheme(theme);
  }

  /**
   * A beállítások mentése vagy sem.
   */
  toggleSaveSettings(): void {
    this.settingsService.toggleSaveSettings();
  }

  /**
   * A jegyzet le legyen-e renderelve.
   */
  toggleConvertInput(): void {
    this.settingsService.toggleConvertInput();
  }

  /**
   * A szerkesztői felületen a mégse gomb megnyomására a megerősítő üzenet ki-be kapcsolása.
   */
  toggleConfirmCancel(): void {
    this.settings.confirmCancel = !this.settings.confirmCancel;
  }

  /**
   * A bővített nézeten a törlés gomb megnyomására a megerősítő üzenet ki-be kapcsolása.
   */
  toggleConfirmDelete(): void {
    this.settings.confirmDelete = !this.settings.confirmDelete;
  }

  /**
   * Álljon-e meg a videó ha meg lesz nyitva a jegyzetelő vagy beállítások felület.
   */
  toggleStopVideoOnNote(): void {
    this.settingsService.toggleStopVideoOnNote();
  }

  /**
   * Induljon-e el a videó (és záródjon-e be a jegyzetelő felület) egy bejegyzés mentése után.
   */
  toggleStartVideoOnSave(): void {
    this.settingsService.toggleStartVideoOnSave();
  }

  /**
   * A videó képernyőkép minőségének beállítása százalékban.
   * @param event - A képernyőkép minőségének beállítani kívánt értéke százalékban eseményként.
   */
  setThumbnailQualityPercentage(event: Event): void {
    const dirtyThumbnailQualityPercentage = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailQualityPercentage)) || 100;

    if (isNaN(sanitizedValue) || sanitizedValue < 0)
    {
      this.settings.thumbnailQualityPercentage = 100;
    }
    else
    {
      this.settings.thumbnailQualityPercentage = sanitizedValue;
    }
  }

  /**
   * A videó képernyőkép szélességének beállítása.
   * @param event - A képernyőkép szélességének beállítani kívánt értéke eseményként.
   */
  setThumbnailWidth(event: Event): void {
    const dirtyThumbnailWidth = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailWidth)) || 1;

    if (isNaN(sanitizedValue) || sanitizedValue < 0 || sanitizedValue > 2048)
    {
      this.settings.thumbnailWidth = 1;
    }
    else
    {
      this.settings.thumbnailWidth = sanitizedValue;
    }
  }

  /**
   * A videó képernyőkép magasságának beállítása.
   * @param event - A képernyőkép magasságának beállítani kívánt értéke eseményként.
   */
  setThumbnailHeight(event: Event): void {
    const dirtyThumbnailHeight = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailHeight)) || 1;

    if (isNaN(sanitizedValue) || sanitizedValue < 0 || sanitizedValue > 2048)
    {
      this.settings.thumbnailHeight = 1;
    }
    else
    {
      this.settings.thumbnailHeight = sanitizedValue;
    }
  }

  /**
   * A szerkesztési nézetben az idő előretekerés mértékegységének változtatása.
   * @param event - A szerkesztési nézetben az idő előretekerésére beállítani kívánt mértékegység eseményként.
   */
  setThumbnailForwardRate(event: Event): void {
    const dirtyThumbnailForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailForwardRate)) || 1;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0 || sanitizedValue > 10000)
    {
      this.settings.thumbnailForwardRate = 1;
    }
    else
    {
      this.settings.thumbnailForwardRate = sanitizedValue;
    }
  }

  /**
   * A szerkesztési nézetben az idő hátratekerés mértékegységének változtatása.
   * @param event - A szerkesztési nézetben az idő hátratekerésére beállítani kívánt mértékegység eseményként.
   */
  setThumbnailRewindRate(event: Event): void {
    const dirtyThumbnailRewindRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailRewindRate)) || 1;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0 || sanitizedValue > 10000)
    {
      this.settings.thumbnailRewindRate = 1;
    }
    else
    {
      this.settings.thumbnailRewindRate = sanitizedValue;
    }
  }

  /**
   * A jegyzetelés gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutNote(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'n';
    this.settings.shortcuts.note = value;
  }

  /**
   * A beállítások gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutSettings(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'q';
    this.settings.shortcuts.settings = value;
  }

  /**
   * A képernyőkép előretekerése gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutThumbnailMoveForward(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'f';
    this.settings.shortcuts.thumbnailMoveForward = value;
  }

  /**
   * A képernyőkép hátratekerése gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutThumbnailMoveRewind(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'r';
    this.settings.shortcuts.thumbnailMoveRewind = value;
  }

  /**
   * A mentés gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutSave(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 's';
    this.settings.shortcuts.save = value;
  }

  /**
   * A mégse gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutCancel(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'c';
    this.settings.shortcuts.cancel = value;
  }

  /**
   * A félkövér gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutBold(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'b';
    this.settings.shortcuts.bold = value;
  }

  /**
   * A dőlt gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutItalic(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'i';
    this.settings.shortcuts.italic = value;
  }

  /**
   * A áthúzott gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutStrikethrough(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'h';
    this.settings.shortcuts.strikethrough = value;
  }

  /**
   * A számozott lista gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutOrderedList(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'o';
    this.settings.shortcuts.orderedList = value;
  }

  /**
   * A számozatlan lista gyorsbillentyű beállítása.
   * @param event - A megadott gyorsbillentyű.
   */
  setShortcutUnorderedList(event: Event): void {
    const value = (DOMPurify.sanitize((event.target as HTMLInputElement).value) || '').charAt(0) || 'u';
    this.settings.shortcuts.unorderedList = value;
  }

  /**
   * A súgó ki-be kapcsolása.
   * @param key - A súgó kulcsa.
   */
  toggleHelp(key: string) {
    this.helpOpen[key] = !this.helpOpen[key];
  }

  /**
   * Megnézi, hogy az adott kulcsú súgó nyitva van-e.
   * @param key - A súgó kulcsa.
   * @returns - Nyitva van-e.
   */
  isHelpOpen(key: string) {
    return !!this.helpOpen[key];
  }

  /**
   * A paraméterként megkapott JSON fájl tisztítása.
   * @param data - A tisztítani kívánt JSON fájl.
   * @returns - A megtisztított JSON fájl.
   */
  private sanitizeInput(data: any) {
    const sanitizedData: any = {};

    Object.keys(data).forEach(key =>
    {
      if (typeof data[key] === 'string')
      {
        sanitizedData[key] = DOMPurify.sanitize(data[key]).trim();
      }
      else
      {
        sanitizedData[key] = data[key];
      }
    });

    return sanitizedData;
  }

  /**
   * A videó vezérlősávjának a videóval való átfedésének ki és be kapcsolása.
   * @param offset - A videó vezérlősávjának jelenlegi értéke (ki-be).
   */
  private changeOffset(offset: boolean): void {
    const value = offset ? '-65px' : '0px';
    document.documentElement.style.setProperty('--video-navbar-offset', value);
  }
}
