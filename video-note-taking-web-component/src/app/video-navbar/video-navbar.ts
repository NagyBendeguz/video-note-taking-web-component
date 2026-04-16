import { Component } from '@angular/core';
import { VideoService } from '../services/video';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';

@Component({
  selector: 'app-video-navbar',
  standalone: false,
  templateUrl: './video-navbar.html',
  styleUrl: './video-navbar.sass',
})
export class VideoNavbar {
  isPlaying$!: Observable<boolean>;
  volumePercentage$!: Observable<number>;
  private previousVolume: number = 100;
  duration$!: Observable<number>;
  private duration: number = 0;
  currentTime$!: Observable<number>;
  isNote$!: Observable<boolean>;
  private isNote: boolean = false;
  isSettings$!: Observable<boolean>;
  private isSettings: boolean = false;
  fullscreenRequest$!: Observable<boolean>;
  private fullscreenRequest: boolean = false;
  private videoForwardRate!: number;
  private videoRewindRate!: number;
  private settings!: Settings;
  private unsubscribe$ = new Subject<void>();

  constructor(private videoService: VideoService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.isPlaying$ = this.videoService.getPlaying();

    this.volumePercentage$ = this.videoService.getVolume();

    this.volumePercentage$
    .pipe(
      takeUntil(this.unsubscribe$),
      // Csak akkor mentse le a hangerő változást ha nem nulla a jelenlegi hangerő.
      filter(currentVolume => currentVolume !== 0)
    )
    .subscribe(currentVolume => {
      this.previousVolume = currentVolume;
    });

    this.duration$ = this.videoService.getDuration();

    this.videoService.duration$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentDuration => {
      this.duration = currentDuration;
    });

    this.currentTime$ = this.videoService.getCurrentTime();

    this.isNote$ = this.videoService.getNote();

    this.videoService.isNote$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsNote => {
      this.isNote = currentIsNote;
    });

    this.isSettings$ = this.videoService.getSettings();

    this.videoService.isSettings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsSettings => {
      this.isSettings = currentIsSettings;
    });

    this.fullscreenRequest$ = this.videoService.getFullscreen();

    this.videoService.fullscreenRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentFullscreenRequest => {
      this.fullscreenRequest = currentFullscreenRequest;
    });

    this.settingsService.videoForwardRate$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVideoForwardRate => {
      this.videoForwardRate = currentVideoForwardRate;
    });

    this.settingsService.videoRewindRate$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVideoRewindRate => {
      this.videoRewindRate = currentVideoRewindRate;
    });

    this.settingsService.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;
    });

    window.addEventListener('keydown', this.keyHandler);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    window.removeEventListener('keydown', this.keyHandler);
  }

  /**
   * Indítás és megállítás kibocsátása.
   */
  onTogglePlay(): void {
    this.videoService.emitTogglePlay();
  }

  /**
   * Hátra tekerés kibocsátása.
   */
  onRewind(): void {
    this.videoService.emitRewind(this.videoRewindRate);
  }

  /**
   * Előre tekerés kibocsátása.
   */
  onForward(): void {
    this.videoService.emitForward(this.videoForwardRate);
  }

  /**
   * A videó hangerejének szabályozása csúszkával.
   * @param value - Hangerő.
   */
  setVolume(value: string): void {
    const volume = Number(value);
    this.videoService.setVolume(volume);
  }

  /**
   * A videó némítása gombnyomásra.
   */
  mute(): void {
    this.videoService.setVolume(0);
  }

  /**
   * A videó hangerejének gombnyomásra való visszaállítása az előző hangerőre (ami nem nulla).
   */
  unMute(): void {
    this.videoService.setVolume(this.previousVolume);
  }

  /**
   * A videó jelenlegi idejének beállítása a progress bar-ra való kattintással.
   * @param event - Az egér kattintási eseménye a videó progress bar-ján.
   */
  setCurrentTimeByClick(event: MouseEvent): void {
    // Az új időhöz szükséges változók kiszámítása.
    const progressBar = event.target as HTMLProgressElement;
    const clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    const barWidth = progressBar.clientWidth;

    // Az új idő kiszámítása.
    const newTime = (clickPosition / barWidth) * this.duration;

    document.dispatchEvent(new CustomEvent('setVideoTime', { detail: newTime }));
  }

  /**
   * A jegyzetelés oldal ki-be kapcsolása.
   */
  toggleNotePage(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isSettings)
    {
      this.toggleSettingsPage();
    }

    // A videó megállítása vagy folytatása beállítástól függően.
    if (this.settings.stopVideoOnNote)
    {
      this.videoService.setPlaying(this.isNote ? true : false);
    }

    this.videoService.setNote(!this.isNote);
  }

  /**
   * A beállítások oldal ki-be kapcsolása.
   */
  toggleSettingsPage(): void {
    // Ha nyitva van a másik oldal akkor először bezárja azt.
    if (this.isNote)
    {
      this.toggleNotePage();
    }

    // A videó megállítása vagy folytatása beállítástól függően.
    if (this.settings.stopVideoOnNote)
    {
      this.videoService.setPlaying(this.isSettings ? true : false);
    }

    this.videoService.setSettings(!this.isSettings);
  }

  /**
   * A teljes képernyős mód ki-be kapcsolása.
   */
  toggleFullscreen(): void {
    this.videoService.setFullscreen(!this.fullscreenRequest);
  }

  /**
   * Megvizsgálja, hogy a jelenlegi aktív elem az egy bemeneti mező-e.
   * @returns - Az aktív elem az egy bemeneti mező-e vagy sem.
   */
  private isTypingInField(): boolean {
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement)
    {
      return false;
    }
    const tag = activeElement.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || activeElement.isContentEditable)
    {
      return true;
    }
    return false;
  }

  /**
   * Gyorsbillentyűk.
   * @param e - Billentyű vagy billentyű kombináció esemény.
   */
  private keyHandler = (e: KeyboardEvent) => {
    // Jegyzetelés oldal megnyitása vagy becsukása.
    if (e.shiftKey && e.key?.toLowerCase() === 'n')
    {
      this.setKeyboardEvent(e);
      this.toggleNotePage();
    }
    // Beállítások oldal megnyitása vagy becsukása.
    else if (e.shiftKey && e.key?.toLowerCase() === 'p')
    {
      this.setKeyboardEvent(e);
      this.toggleSettingsPage();
    }
    // A videó előre tekerése.
    else if (!this.isTypingInField() && e.key === 'ArrowLeft')
    {
      this.setKeyboardEvent(e);
      this.onRewind();
    }
    // A videó hátra tekerése.
    else if (!this.isTypingInField() && e.key === 'ArrowRight')
    {
      this.setKeyboardEvent(e);
      this.onForward();
    }
  };

  /**
   * Gyorsbillentyűk kezelése.
   * @param e - Billentyű vagy billentyű kombináció esemény.
   */
  private setKeyboardEvent(e: KeyboardEvent): void {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}
