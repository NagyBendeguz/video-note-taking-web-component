import { Component } from '@angular/core';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { Observable, Subject, takeUntil } from 'rxjs';
import { EntryService } from '../services/entry';
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
  settingsLocal: Settings = new Settings();
  playbackSpeeds: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  isSubtitleVisible: boolean = false;
  isOffsetNegative: boolean = true;
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
        thumbnail: { type: "string" }
      },
      required: ["entryId", "title", "timestamp", "note", "thumbnail"],
      additionalProperties: false,
    }
  };

  constructor (private settingsSerivce: SettingsService, private entryService: EntryService) {}

  ngOnInit(): void {
    this.settings$ = this.settingsSerivce.getSettings();

    this.settingsSerivce.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settingsLocal = currentSettings;
    });
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
    this.settingsSerivce.setPlaybackRate(speed);
  }

  /**
   * A videó feliratok ki és be kapcsolása.
   */
  toggleSubtitles(): void {
    this.settingsSerivce.toggleSubtitles();
    this.isSubtitleVisible = !this.isSubtitleVisible;
  }

  /**
   * A videó vezérlősávjának a videóval való átfedésének ki és be kapcsolása.
   */
  toggleOffset(): void {
    const value = this.isOffsetNegative ? '0px' : '-65px';
    document.documentElement.style.setProperty('--video-navbar-offset', value);
    this.isOffsetNegative = !this.isOffsetNegative;
    this.settingsSerivce.setVideoNavbarOffset(this.isOffsetNegative);
  }

  /**
   * A szerkesztési nézetben az idő előretekerés mértékegységének változtatása.
   * @param event - A szerkesztési nézetben az idő előretekerésére beállítani kívánt mértékegység.
   */
  setThumbnailForwardRate(event: Event): void {
    const dirtyThumbnailForwardRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailForwardRate));

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settingsLocal.thumbnailForwardRate = 1;
    }
    else
    {
      this.settingsLocal.thumbnailForwardRate = sanitizedValue;
    }
  }

  /**
   * A szerkesztési nézetben az idő hátratekerés mértékegységének változtatása.
   * @param event - A szerkesztési nézetben az idő hátratekerésére beállítani kívánt mértékegység.
   */
  setThumbnailRewindRate(event: Event): void {
    const dirtyThumbnailRewindRate = (event.target as HTMLInputElement).value;
    const sanitizedValue = Number(DOMPurify.sanitize(dirtyThumbnailRewindRate));

    // Ellenőrizni, hogy a bemenet az egy érvényes szám-e.
    if (isNaN(sanitizedValue) || sanitizedValue <= 0)
    {
      this.settingsLocal.thumbnailRewindRate = 1;
    }
    else
    {
      this.settingsLocal.thumbnailRewindRate = sanitizedValue;
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
        try {
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
}
