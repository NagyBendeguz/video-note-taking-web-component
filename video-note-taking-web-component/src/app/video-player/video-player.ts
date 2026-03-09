import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild } from '@angular/core';
import { VideoService } from '../services/video';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-video-player',
  standalone: false,
  templateUrl: './video-player.html',
  styleUrl: './video-player.sass',
})
export class VideoPlayer {
  @Input() src: string = "";
  private srcSubject = new BehaviorSubject<string>(this.src);
  src$: Observable<string> = this.srcSubject.asObservable();
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  volumePercentageLocal: number = 100;
  isNote$!: Observable<boolean>;
  isNoteLocal: boolean = false;
  isSettings$!: Observable<boolean>;
  isSettingsLocal: boolean = false;
  fullscreenRequestLocal: boolean = false;
  rewindSeconds: number = 10;
  forwardSeconds: number = 10;
  timestamp: string = "00:00:00.000";
  private unsubscribe$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef, private videoService: VideoService) {}

  ngOnInit(): void {
    this.checkFullscreen();
  }

  ngAfterViewInit(): void {
    this.videoService.togglePlay.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.togglePlay());
    this.videoService.rewind.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.rewind());
    this.videoService.forward.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.forward());
    this.videoService.timestamp$.pipe(takeUntil(this.unsubscribe$)).subscribe(timestamp => {
      this.timestamp = timestamp;
    });
    this.videoService.jumpToTimestamp.pipe(takeUntil(this.unsubscribe$)).subscribe(() => this.jumpToTimestamp());

    // A hangerő szabályozása.
    this.videoService.volume$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentVolume => {
      this.volumePercentageLocal = currentVolume;
      this.changeVolume();
    });

    // A videó jelenlegi idejének beállítása egy egyedi eseménnyel.
    document.addEventListener('setVideoTime', (event: CustomEvent) => {
      this.setVideoTimeByClick(event);
    });

    this.isNote$ = this.videoService.getNote();

    // A jegyzetelő felület megnyitásakor és amikor nyitva van folyamatosan készítsen képernyőképeket a videó adott képkockájáról.
    this.videoService.isNote$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentNote => {
      this.isNoteLocal = currentNote;
      if (currentNote)
      {
        this.createCurrentThumbnail();
      }
    });

    this.isSettings$ = this.videoService.getSettings();

    this.videoService.isSettings$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentSettings => {
      this.isSettingsLocal = currentSettings;
    });

    this.videoService.fullscreenRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe(currentFullscreenRequest => {
      this.fullscreenRequestLocal = currentFullscreenRequest;
      this.setFullscreen();
      this.cdr.detectChanges();
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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    document.removeEventListener('setVideoTime', this.setVideoTimeByClick);
  }

  @HostListener('window:resize')
  onResize() {
    this.setVideoHeight();
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
  rewind(): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.max(video.currentTime - this.rewindSeconds, 0);
  }

  /**
   * A videó előre tekerése.
   */
  forward(): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.min(video.currentTime + this.forwardSeconds, video.duration);
    if (video.currentTime === video.duration)
    {
      video.pause();
      this.videoService.setPlaying(false);
    }
  }

  /**
   * A videó hangerejének változtatása.
   */
  changeVolume(): void {
    const video = this.videoElement.nativeElement;
    video.volume = this.volumePercentageLocal / 100;
  }

  /**
   * A videó meta adatainak betöltésekor a videó hosszának és magasságának betöltése.
   * @param event - Esemény.
   */
  onVideoMetadataLoaded(event: Event): void {
    this.setDuration();
    this.setVideoHeight();
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
   */
  setCurrentTime(): void {
    const video = this.videoElement.nativeElement;
    this.videoService.setCurrentTime(video.currentTime);
    if (this.isNoteLocal)
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

  /**
   * A teljes képernyős módba való belépés és kilépés.
   */
  setFullscreen(): void {
    const player = this.videoPlayer.nativeElement;
    if (this.fullscreenRequestLocal)
    {
      player.requestFullscreen();
    }
    else if (document.fullscreenElement)
    {
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
    if (!this.isSettingsLocal && !this.isNoteLocal)
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
   * A videó jelenlegi képkockájáról elkészíteni egy képernyőképet.
   */
  private createCurrentThumbnail(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext("2d");

    if (context)
    {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Jelenlegi videó frame-je.
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Átalakítani a videó frame-t base64-re.
      const dataURL = canvas.toDataURL("image/png");

      this.videoService.setThumbnail(dataURL);
    }
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
}
