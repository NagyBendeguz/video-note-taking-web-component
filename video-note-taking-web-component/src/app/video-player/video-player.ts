import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Video } from '../services/video';

@Component({
  selector: 'app-video-player',
  standalone: false,
  templateUrl: './video-player.html',
  styleUrl: './video-player.sass',
})
export class VideoPlayer {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  isSettings: boolean = false;
  fullscreenRequest: boolean = false;
  rewindSeconds = 10;
  forwardSeconds = 10;

  constructor(private cdr: ChangeDetectorRef, private videoService: Video) {}

  ngOnInit(): void {
    this.checkFullscreen();
  }

  ngAfterViewInit(): void {
    const video = this.videoElement.nativeElement;

    // A hangerő szabályozása.
    this.videoService.volume$.subscribe(volume => {
      video.volume = volume / 100;
      this.cdr.detectChanges();
    });

    // A videó idejének lekérése.
    video.addEventListener('loadedmetadata', () => {
      this.videoService.setDuration(video.duration);
      this.cdr.detectChanges();
    });

    // A jelenlegi idő lekérése.
    video.addEventListener('timeupdate', () => {
      this.videoService.setCurrentTime(video.currentTime);
      this.cdr.detectChanges();
    });

    // A videó jelenlegi idejének beállítása egy egyedi eseménnyel.
    document.addEventListener('setVideoTime', (event: CustomEvent) => {
      video.currentTime = event.detail;
      this.cdr.detectChanges();
    });

    this.videoService.isSettings$.subscribe(settings => {
      this.isSettings = settings;
      this.cdr.detectChanges();
    });

    this.videoService.fullscreenRequest$.subscribe(fullscreenRequest => {
      this.fullscreenRequest = fullscreenRequest;
      this.fullscreen();
      this.cdr.detectChanges();
    });
  }

  // TODO - Renderer2 ???

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
   * A teljes képernyős módba való belépés és kilépés.
   */
  fullscreen(): void {
    const player = this.videoPlayer.nativeElement;
    if (this.fullscreenRequest)
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
}
