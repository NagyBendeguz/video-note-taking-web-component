import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { VideoService } from '../services/video';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { SettingsService } from '../services/settings';
import { Settings } from '../models/settings';
import { TranslateLoader, TranslateService, TranslateStore } from '@ngx-translate/core';
import { EntryService } from '../services/entry';
import { PdfService } from '../services/pdf';
import pica from 'pica';
import InlineTranslateLoader from '.././i18n/inline-translate-loader';
import en from '.././i18n/en.json';
import hu from '.././i18n/hu.json';

@Component({
  selector: 'video-player',
  standalone: false,
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [
    EntryService,
    VideoService,
    SettingsService,
    PdfService,
    TranslateService,
    TranslateStore,
    { provide: TranslateLoader, useFactory: () => new InlineTranslateLoader({ en, hu }) },
  ],
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
  private prefix = 'theme-';
  private outsideListener = (e: Event) => this.onGlobalPointer(e);

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private videoService: VideoService,
    private settingsService: SettingsService,
    private translate: TranslateService
  ) {
    // Bootstrap ikonok importálása.
    const sr = (this.el.nativeElement as HTMLElement).shadowRoot!;

    function absoluteBase(baseCandidate: string | null | undefined): string {
      if (!baseCandidate)
      {
        return document.baseURI || location.href;
      }
      // Ha már abszolút útvonal akkor vissaadás.
      try
      {
        new URL(baseCandidate);
        return baseCandidate;
      }
      catch {}
      // Ha '/'-rel kezdődik, akkor az eredeti domainhez hozzárendelés.
      if (baseCandidate.startsWith('/'))
      {
        return location.origin + baseCandidate;
      }
      // Ellenkező esetben a document.baseURI-hez viszonyítva feloldani.
      return new URL(baseCandidate, document.baseURI || location.href).href;
    }

    function getCssUrl(): string {
      // A böngésző bővítmény futtatása ideje.
      try
      {
        const maybeChrome = (globalThis as any).chrome;
        if (maybeChrome && maybeChrome.runtime && typeof maybeChrome.runtime.getURL === 'function') {
          return maybeChrome.runtime.getURL('assets/bootstrap-icons/bootstrap-icons.css');
        }
      }
      catch {}

      // A jelenlegi script (bundle).
      const cs = document.currentScript as HTMLScriptElement | null;
      if (cs && cs.src)
      {
        return new URL('./assets/bootstrap-icons/bootstrap-icons.css', cs.src).href;
      }

      // Az alapértelmezett href / document.baseURI használata.
      const baseHref = document.querySelector('base')?.getAttribute('href') ?? document.baseURI ?? location.origin + '/';
      const absBase = absoluteBase(baseHref);
      return new URL('assets/bootstrap-icons/bootstrap-icons.css', absBase).href;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = getCssUrl();
    sr.appendChild(link);

    // Nyelv beállítása.
    this.translate.use('en');
  }

  ngOnInit(): void {
    // CSS változók beállítása.
    const host = this.el.nativeElement as HTMLElement;
    const computed = getComputedStyle(document.documentElement);
    const vars = [
      '--video-height','--video-navbar-offset','--icon-color','--text-color',
      '--background-color','--video-navbar-background-color','--input-color',
      '--input-background-color','--help-color'
    ];
    vars.forEach(v => {
      const val = computed.getPropertyValue(v).trim();
      if (val) host.style.setProperty(v, val);
    });

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
    this.videoService.time$.pipe(takeUntil(this.unsubscribe$)).subscribe(t => {
      this.setVideoTimeByClick(t);
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

    this.settingsService.offsetChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(v => {
      (this.el.nativeElement as HTMLElement).style.setProperty('--video-navbar-offset', v);
    });

    this.settingsService.settings$.subscribe(s => {
      this.applyThemeToHost(s.theme);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'])
    {
      this.srcSubject.next(changes['src'].currentValue);

      // Ha nem ez az első alkalom a forrás beállítására.
      if (changes['src'].previousValue)
      {
        const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
        video.crossOrigin = 'anonymous';
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
    document.removeEventListener('pointerdown', this.outsideListener, { capture: true });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.setVideoHeight();
  }

  /**
   * A videó indítása és megállítása.
   * @param isPlaying - A videó lejátszásának állapota.
   */
  setPlay(isPlaying: boolean): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    video.currentTime = Math.max(video.currentTime - moveRate, 0);
  }

  /**
   * A videó előre tekerése.
   */
  forward(moveRate: number): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    this.videoService.setDuration(video.duration);
  }

  /**
   * A videó jelenlegi idejének beállítása.
   * Jegyzetelő módban képernyőképet készít a videó jelenlegi képkockájáról.
   */
  setCurrentTime(): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    this.videoService.setCurrentTime(video.currentTime);

    // Ha a jegyzetelő felület van megnyitva akkor készítsen képernyőképet a videó jelenlegi képkockájáról.
    if (this.isNote)
    {
      this.createCurrentThumbnail();
    }
  }

  /**
   * A videó jelenlegi idejének beállítása egér kattintásra a progress bar-on.
   * @param time - A videó jelenlegi ideje.
   */
  setVideoTimeByClick(time: number): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    video.currentTime = time;
  }

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
   * Aktiválni a jelenelgi elemet.
   */
  activate(): void {
    this.videoService.setIsActive(true);
    document.addEventListener('pointerdown', this.outsideListener, { capture: true });
  }

  /**
   * Deaktiválni a jelenlegi elemet.
   */
  deactivate(): void {
    this.videoService.setIsActive(false);
    document.removeEventListener('pointerdown', this.outsideListener, { capture: true });
  }

  /**
   * Annak érzékelésére ha nem a fullscreen gombra kattintással lép ki a teljes képernyős módból, akkor is váltson át a gomb funkciója és a videó vezérlősáv eltolása.
   */
  private checkFullscreen(): void {
    document.addEventListener('fullscreenchange', () =>
    {
      if (!document.fullscreenElement)
      {
        this.videoService.setFullscreen(false);
        if (this.navbarOffsetState)
        {
          this.settingsService.toggleVideoNavbarOffset();
          this.navbarOffsetState = false;
        }
      }
    });
  }

  /**
   * A videó eredeti magasságának beállítása.
   */
  private setVideoHeight(): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const heightPx = `${height}px`;
    const host = this.el.nativeElement as HTMLElement;
    host.style.setProperty('--video-height', heightPx);
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    this.settingsService.updateThumbnailWidth(video.videoWidth);
    this.settingsService.updateThumbnailHeight(video.videoHeight);
  }

  /**
   * A tömörített vagy bővített nézetben a időbélyegre kattintva ugorjon a videó a megfelelő pillanatára.
   */
  private jumpToTimestamp(): void {
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;

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
    const video: HTMLVideoElement = (this.el.nativeElement as HTMLElement).shadowRoot!.querySelector('video')!;
    video.playbackRate = rate;
  }

  /**
   * Átalakítja a rövidített nyelvet pl.: en -> English.
   * @param lang - A rövidített nyelv a lang-hoz.
   * @returns - Az átalakított nyelv a label-hez.
   */
  private getLanguageLabel(lang: string): string {
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(lang) || '';
    }
    catch (error) {
      return 'Unknown Language';
    }
  }

  /**
   * A kattintás ellenőrzése, hogy az elemen belül vagy kívül történt.
   * @param e - Esemény a kattintásról.
   */
  private onGlobalPointer(e: Event): void {
    const path = (e as any).composedPath?.() || (e as any).path || [];
    const clickedInside = path.length ? path.includes(this.el.nativeElement) : this.el.nativeElement.contains(e.target as Node);
    if (!clickedInside)
    {
      this.deactivate();
    }
  }

  /**
   * A beállított téma átállítása.
   * @param name - Téma neve.
   */
  private applyThemeToHost(name: string): void {
    const host = this.el.nativeElement as HTMLElement;
    Array.from(host.classList)
      .filter(c => c.startsWith(this.prefix))
      .forEach(c => host.classList.remove(c));
    host.classList.add(this.prefix + name);
  }
}
