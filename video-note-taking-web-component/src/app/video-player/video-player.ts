import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild } from '@angular/core';
import { VideoService } from '../services/video';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { TranslateService } from '@ngx-translate/core';
import pica from 'pica';

@Component({
  selector: 'app-video-player',
  standalone: false,
  templateUrl: './video-player.html',
  styleUrl: './video-player.sass',
})
export class VideoPlayer {
  // Videó forrása.
  @Input() src: string = '';
  private srcSubject = new BehaviorSubject<string>(this.src);
  src$: Observable<string> = this.srcSubject.asObservable();

  // Felirat forrása.
  @Input() subtitle: string = '';
  private subtitleSubject = new BehaviorSubject<string>(this.subtitle);
  subtitle$: Observable<string> = this.subtitleSubject.asObservable();

  // Nyelv.
  @Input() lang: string = '';
  private langSubject = new BehaviorSubject<string>(this.lang);
  lang$: Observable<string> = this.langSubject.asObservable();

  // Nyelvből készült címke.
  label: string = '';
  private labelSubject = new BehaviorSubject<string>(this.label);
  label$: Observable<string> = this.labelSubject.asObservable();

  // Videó elemei.
  @ViewChild('videoPlayerDiv') videoPlayerDiv!: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('subtitlesTrack') subtitlesTrack!: ElementRef<HTMLTrackElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  isNote$!: Observable<boolean>;
  isNote: boolean = false;
  isSettings$!: Observable<boolean>;
  isSettings: boolean = false;
  private timestamp: string = '00:00:00.000';
  private navbarOffsetState: boolean = false;
  private isVideoNavbarOffset!: boolean;
  private settings: Settings = new Settings();
  private unsubscribe$ = new Subject<void>();
  private pica = new pica();

  constructor(
    private cdr: ChangeDetectorRef,
    private videoService: VideoService,
    private settingsService: SettingsService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.checkFullscreen();
  }

  ngAfterViewInit(): void {
    this.videoService.togglePlay.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.togglePlay());

    this.videoService.rewind.pipe(takeUntil(this.unsubscribe$)).subscribe((moveRate: number) => {
      this.rewind(moveRate);
    });

    this.videoService.forward.pipe(takeUntil(this.unsubscribe$)).subscribe((moveRate: number) => {
      this.forward(moveRate);
    });

    this.videoService.isPlaying$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsPlaying => {
      this.setPlay(currentIsPlaying);
    });

    this.videoService.timestamp$.pipe(takeUntil(this.unsubscribe$)).subscribe(timestamp => {
      this.timestamp = timestamp;
    });

    this.videoService.jumpToTimestamp.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.jumpToTimestamp());

    // A hangerő szabályozása.
    this.videoService.volume$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVolumePercentage => {
      this.changeVolume(currentVolumePercentage);
    });

    // A videó jelenlegi idejének beállítása egy egyedi eseménnyel.
    document.addEventListener('setVideoTime', (event: CustomEvent) => {
      this.setVideoTimeByClick(event);
    });

    this.isNote$ = this.videoService.getNote();

    // A jegyzetelő felület megnyitásakor és amikor nyitva van folyamatosan készítsen képernyőképeket a videó adott képkockájáról.
    this.videoService.isNote$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentNote => {
      this.isNote = currentNote;
      if (currentNote)
      {
        this.createCurrentThumbnail();
      }
    });

    this.isSettings$ = this.videoService.getSettings();

    this.videoService.isSettings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.isSettings = currentSettings;
    });

    // Teljes képrenyős mód változtatása.
    this.videoService.fullscreenRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentFullscreenRequest => {
      this.setFullscreen(currentFullscreenRequest);
      this.cdr.detectChanges();
    });

    // Videó lejátszási sebességének változtatása.
    this.settingsService.playbackRate$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentPlaybackRate => {
      this.setVideoPlaybackRate(currentPlaybackRate);
    });

    // Videó feliratának ki-be kapcsolása.
    this.settingsService.isVisible$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentIsVisible => {
      this.setVideoSubtitleVisibility(currentIsVisible);
    });

    // Videó vezérlősávjának az eltolása.
    this.settingsService.videoNavbarOffset$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentOffset => {
      this.isVideoNavbarOffset = currentOffset;
    });

    // A beállításokra feliratkozás.
    this.settingsService.settings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.settings = currentSettings;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'])
    {
      this.srcSubject.next(changes['src'].currentValue);

      // Ha nem ez az első alkalom a forrás beállítására.
      if (changes['src'].previousValue)
      {
        const video = this.videoElement.nativeElement;
        video.src = changes['src'].currentValue;
      }
    }
    if (changes['subtitle'])
    {
      this.subtitleSubject.next(changes['subtitle'].currentValue);

      // Ha nem ez az első alkalom a forrás beállítására.
      if (changes['subtitle'].previousValue)
      {
        let track = this.subtitlesTrack.nativeElement;
        track.src = changes['subtitle'].currentValue;
      }
    }
    if (changes['lang'])
    {
      this.langSubject.next(changes['lang'].currentValue);
      this.labelSubject.next(this.getLanguageLabel(changes['lang'].currentValue));

      // Ha nem ez az első alkalom a forrás beállítására.
      if (changes['lang'].previousValue)
      {
        let track = this.subtitlesTrack.nativeElement;
        track.lang = changes['lang'].currentValue;
        track.label = this.getLanguageLabel(changes['lang'].currentValue);
      }
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    document.removeEventListener('setVideoTime', this.setVideoTimeByClick);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.setVideoHeight();
  }

  setPlay(isPlaying: boolean): void {
    const video = this.videoElement.nativeElement;
    if (isPlaying)
    {
      video.play();
    }
    else
    {
      video.pause();
    }
  }

  /**
   * A videó indítása vagy megállítása.
   */
  togglePlay(): void {
    const video = this.videoElement.nativeElement;
    if (video.paused)
    {
      video.play();
      this.videoService.setPlaying(true);
    }
    else
    {
      video.pause();
      this.videoService.setPlaying(false);
    }
  }

  /**
   * A videó hátra tekerése.
   */
  rewind(moveRate: number): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.max(video.currentTime - moveRate, 0);
  }

  /**
   * A videó előre tekerése.
   */
  forward(moveRate: number): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.min(video.currentTime + moveRate, video.duration);
    if (video.currentTime === video.duration)
    {
      video.pause();
      this.videoService.setPlaying(false);
    }
  }

  /**
   * A videó hangerejének változtatása.
   */
  changeVolume(volumePercentage: number = 100): void {
    const video = this.videoElement.nativeElement;
    video.volume = volumePercentage / 100;
  }

  /**
   * A videó meta adatainak betöltésekor a videó hosszának és magasságának betöltése és ezt a beállításokba elmenteni.
   */
  onVideoMetadataLoaded(): void {
    this.setDuration();
    this.setVideoHeight();
    this.setThumbnailSettings();
  }

  /**
   * A videó hosszának beállítása.
   */
  setDuration(): void {
    const video = this.videoElement.nativeElement;
    this.videoService.setDuration(video.duration);
  }

  /**
   * A videó jelenlegi idejének beállítása.
   * Jegyzetelő módban képernyőképet készít a videó jelenlegi képkockájáról.
   */
  setCurrentTime(): void {
    const video = this.videoElement.nativeElement;
    this.videoService.setCurrentTime(video.currentTime);

    // Ha a jegyzetelő felület van megnyitva akkor készítsen képernyőképet a videó jelenlegi képkockájáról.
    if (this.isNote)
    {
      this.createCurrentThumbnail();
    }
  }

  /**
   * A videó jelenlegi idejének beállítása egér kattintásra a progress bar-on.
   * @param event - Egyedi esemény a videó jelenlegi idejéről.
   */
  setVideoTimeByClick(event: CustomEvent): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = event.detail;
  }

  // TODO: az ESC billentyűvel a navbar offset beállítás az nem marad meg
  /**
   * A teljes képernyős módba való belépés és kilépés.
   */
  setFullscreen(fullscreenRequest: boolean = false): void {
    const player = this.videoPlayerDiv.nativeElement;
    // Ha teljes képernyős mód kérés történt akkor váltson teljes képernyős módra.
    if (fullscreenRequest)
    {
      // Ha el van tolva a videó vezérlősávja akkor vonja vissza de mentse le a jelenlegi állapotot.
      if (this.isVideoNavbarOffset)
      {
        this.settingsService.toggleVideoNavbarOffset();
        this.navbarOffsetState = true;
      }
      player.requestFullscreen();
    }
    // Ha az oldal már teljes képernyős módban van akkor lépjen ki belőle.
    else if (document.fullscreenElement)
    {
      // Ha a teljes képernyős módba való belépéskor a videó vezérlősávja el volt tolva akkor most kilépéskor állítsa vissza azt.
      if (this.navbarOffsetState)
      {
        this.settingsService.toggleVideoNavbarOffset();
        this.navbarOffsetState = false;
      }
      document.exitFullscreen();
    }
  }

  /**
   * Annak érzékelésére ha nem a fullscreen gombra kattintással lép ki a teljes képernyős módból, akkor is váltson át a gomb funkciója.
   */
  private checkFullscreen(): void {
    document.addEventListener('fullscreenchange', () =>
    {
      if (!document.fullscreenElement)
      {
        this.videoService.setFullscreen(false);
      }
    });
  }

  /**
   * A videó eredeti magasságának beállítása.
   */
  private setVideoHeight(): void {
    const video = this.videoElement.nativeElement;
    // (Az alsó margó miatt plusz 5 pixel.)
    if (!this.isSettings && !this.isNote)
    {
      this.setSassVariable(video.clientHeight + 5);
    }
    else
    {
      this.setSassVariable(video.clientHeight * 2 + 5);
    }
  }

  /**
   * A videó erdeti magasságának beállítása CSS változóként.
   * @param height - A videó eredeti magassága.
   */
  private setSassVariable(height: number): void {
    document.documentElement.style.setProperty('--video-height', `${height}px`);
  }

  /**
   * A videó feliratának ki-be kapcsolása.
   * @param currentIsVisible - A felirat ki-be kapcsolásának jelenlegi állapota.
   */
  private setVideoSubtitleVisibility(currentIsVisible: boolean = false): void {
    const track = this.subtitlesTrack.nativeElement as HTMLTrackElement;
    track.track.mode = currentIsVisible ? 'showing' : 'hidden';
  }

  /**
   * A videó jelenlegi képkockájáról elkészíteni egy képernyőképet a megfelelő minőségben.
   */
  private createCurrentThumbnail(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (context)
    {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Jelenlegi videó frame-je.
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Egy új canvas létrehozása a megadott méretekkel.
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = this.settings.thumbnailWidth;
      outputCanvas.height = this.settings.thumbnailHeight;

      // Pica használata a képek méretének módosításához.
      this.pica.resize(canvas, outputCanvas)
        .then(result => this.pica.toBlob(result, 'image/jpeg', (this.settings.thumbnailQualityPercentage / 100))) // Minőség beállítása.
        .then(blob => this.convertBlobToBase64(blob)) // Blob konvertálása Base64-re.
        .then(dataURL =>
        {
          this.videoService.setThumbnail(dataURL);
        })
        .catch(error =>
        {
          console.error('Error during resizing: ', error);
        }
      );
    }
  }

  /**
   * Blob konvertálása Base64-re
   * @param blob - A megadott kép blob.
   * @returns - A Base64-re konvertált kép.
   */
  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string); // Base64 konvertálása string-re.
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob); // Blob konvertálása Base64-re.
    });
  }

  /**
   * A metaadatok betöltésekor beállítani az alapértelmezett képernyőkép szélességét és magasságát a beállításokba.
   */
  private setThumbnailSettings(): void {
    const video = this.videoElement.nativeElement;
    this.settingsService.updateThumbnailWidth(video.videoWidth);
    this.settingsService.updateThumbnailHeight(video.videoHeight);
  }

  /**
   * A tömörített vagy bővített nézetben a időbélyegre kattintva ugorjon a videó a megfelelő pillanatára.
   */
  private jumpToTimestamp(): void {
    const video = this.videoElement.nativeElement;

    // Másodpercekké alakítás.
    const timeParts = this.timestamp.split(/[:.]+/).map(Number);
    const seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2] + timeParts[3] / 1000;

    video.currentTime = seconds;
  }

  /**
   * A videó lejátszási sebességének a beállítása.
   * @param rate - A beállítani kívánt lejátszási sebesség.
   */
  private setVideoPlaybackRate(rate: number): void {
    const video = this.videoElement.nativeElement;
    video.playbackRate = rate;
  }

  /**
   * Átalakítja a rövidített nyelvet pl.: en -> English.
   * @param lang - A rövidített nyelv a lang-hoz.
   * @returns - Az átalakított nyelv a label-hez.
   */
  getLanguageLabel(lang: string): string {
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || '';
    }
    catch (error) {
      return 'Unknown Language';
    }
  }
}
