import { Component } from '@angular/core';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { Observable, Subject, takeUntil } from 'rxjs';
import { EntryService } from '../services/entry';
import Ajv from 'ajv';
import DOMPurify from 'dompurify';
import { VideoService } from '../services/video';

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

  // A betölteni kívánt JSON fájl struktúrája.
  private jsonSchema =
  {
    type: "array",
    items: {
      type: "object",
      properties: {
        entryId: { type: "integer" },
        title: { type: "string" },
        timestamp: { type: "string" },
        note: { type: "string" },
        formattedNoteHTML: { type: "string" },
        formattedNoteMD: { type: "string" },
        thumbnail: { type: "string" }
      },
      required: ["entryId", "title", "timestamp", "note", "thumbnail"],
      additionalProperties: false,
    }
  };

  constructor (
    private settingsService: SettingsService,
    private entryService: EntryService,
    private videoService: VideoService
  ) {}

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings();

    this.settingsService.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;
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
   * Beállítani a videó lejátszási sebességét.
   * @param event - A kívánt lejátszási sebesség.
   */
  changePlaybackSpeed(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const speed = parseFloat(target.value);
    this.settingsService.setPlaybackRate(speed);
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
   * A jegyzet le legyen-e renderelve.
   */
  toggleConvertInput(): void {
    this.settingsService.toggleConvertInput();
  }

  /**
   * A szerkesztési nézetben az idő előretekerés mértékegységének változtatása.
   * @param event - A szerkesztési nézetben az idő előretekerésére beállítani kívánt mértékegység.
   */
  setThumbnailForwardRate(event: Event): void {
    const dirtyThumbnailForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailForwardRate)) || 1;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
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
   * @param event - A szerkesztési nézetben az idő hátratekerésére beállítani kívánt mértékegység.
   */
  setThumbnailRewindRate(event: Event): void {
    const dirtyThumbnailRewindRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailRewindRate)) || 1;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settings.thumbnailRewindRate = 1;
    }
    else
    {
      this.settings.thumbnailRewindRate = sanitizedValue;
    }
  }

  /**
   * A videó vezérlősávjában az idő előretekerés mértékegységének változtatása.
   * @param event - A videó vezérlősávjában az idő előretekerésére beállítani kívánt mértékegység.
   */
  setVideoForwardRate(event: Event): void {
    const dirtyVideoForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyVideoForwardRate)) || 10;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
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
   * @param event - A videó vezérlősávjában az idő hátratekerésére beállítani kívánt mértékegység.
   */
  setVideoRewindRate(event: Event): void {
    const dirtyVideoForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyVideoForwardRate)) || 10;

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settingsService.setVideoRewindRate(10);
    }
    else
    {
      this.settingsService.setVideoRewindRate(sanitizedValue);
    }
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
          const sanitizedData = jsonData.map((entry: any) => this.sanitizeInput(entry));

          // A megtisztított jegyzet betöltése.
          this.entryService.setArrayEntry(sanitizedData);

          // Megtalálni a legnagyobb bejegyzés id-t.
          const highestEntryId = Math.max(...sanitizedData.map((entry: any) => entry.entryId));

          // A legnagyobb bejegyzés id-t beállítani a jelenlegi id-re, hogy innentől számítsa az új bejegyzésekhez az id-t.
          this.entryService.setCurrentEntryId(highestEntryId);
        }
        catch (error) {
          console.error('Error parsing JSON: ', error);
        }
      };

      reader.readAsText(file);
    }
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
