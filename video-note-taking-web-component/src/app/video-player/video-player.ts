import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { VideoService } from '../services/video';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-video-player',
  standalone: false,
  templateUrl: './video-player.html',
  styleUrl: './video-player.sass',
})
export class VideoPlayer {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  volumePercentageLocal: number = 100;
  isNote$: Observable<boolean> = new Observable<boolean>();
  isNoteLocal: boolean = false;
  isSettings$: Observable<boolean> = new Observable<boolean>();
  isSettingsLocal: boolean = false;
  fullscreenRequestLocal: boolean = false;
  rewindSeconds: number = 10;
  forwardSeconds: number = 10;

  constructor(private cdr: ChangeDetectorRef, private videoService: VideoService) {}

  ngOnInit(): void {
    this.checkFullscreen();
  }

  ngAfterViewInit(): void {
    // A hangerő szabályozása.
    this.videoService.volume$.subscribe(currentVolume => {
      this.volumePercentageLocal = currentVolume;
      this.changeVolume();
    });

    // A videó jelenlegi idejének beállítása egy egyedi eseménnyel.
    document.addEventListener('setVideoTime', (event: CustomEvent) => {
      this.setVideoTimeByClick(event);
    });

    this.isNote$ = this.videoService.getNote();

    this.videoService.isNote$.subscribe(currentNote => {
      this.isNoteLocal = currentNote;
      if (currentNote)
      {
        this.createCurrentThumbnail();
      }
    });

    this.isSettings$ = this.videoService.getSettings();

    this.videoService.isSettings$.subscribe(currentSettings => {
      this.isSettingsLocal = currentSettings;
    });

    this.videoService.fullscreenRequest$.subscribe(currentFullscreenRequest => {
      this.fullscreenRequestLocal = currentFullscreenRequest;
      this.setFullscreen();
      this.cdr.detectChanges();
    });
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
}
