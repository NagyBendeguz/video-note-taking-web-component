import { Component, ElementRef, ViewChild } from '@angular/core';
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
  isPlaying: boolean = false;
  volumePercentage: number = 100;
  fullscreenRequest: boolean = false;
  //duration: number = 0;
  //currentTime: number = 0;
  rewindSeconds = 10;
  forwardSeconds = 10;

  constructor(private videoService: Video) {}

  ngOnInit(): void {
    this.checkFullscreen();
  }

  ngAfterViewInit(): void {
    const video = this.videoElement.nativeElement;

    this.videoService.isPlaying$.subscribe(playing => {
      this.isPlaying = playing;
    });
    
    this.videoService.volume$.subscribe(vol => {
      this.volumePercentage = vol;
      this.volume();
    });

    this.videoService.fullscreenRequest$.subscribe(fullscreenRequest => {
      this.fullscreenRequest = fullscreenRequest;
      this.fullscreen();
    });

    /*this.videoService.duration$.subscribe(duration => {
      this.duration = duration;
    });*/

    /*this.videoService.currentTime$.subscribe(currentTime => {
      this.currentTime = currentTime;
    });*/

    video.addEventListener('loadedmetadata', () => {
      this.videoService.setDuration(video.duration);
    });

    video.addEventListener('timeupdate', () => {
        this.videoService.setCurrentTime(video.currentTime);
        document.dispatchEvent(new CustomEvent('videoTimeUpdate', { detail: video.currentTime }));
    });
  }

  // TODO - Renderer2 ???

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

  rewind(): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.max(video.currentTime - this.rewindSeconds, 0);
  }

  forward(): void {
    const video = this.videoElement.nativeElement;
    video.currentTime = Math.min(video.currentTime + this.forwardSeconds, video.duration);
    if (video.currentTime === video.duration)
    {
      video.pause();
      this.videoService.setPlaying(false);
    }
  }

  volume(): void {
    const video = this.videoElement.nativeElement;
    video.volume = this.volumePercentage / 100;
  }

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

  // TODO - A teljes képernyős módból való kilépésnél az ESC gomb segítségével akkor nem frissül a navbar és azon a fullscreen ikon!

  /**
   * Annak érzékelésére ha nem a fullscreen gombra kattintással lép ki a teljes képernyős módból.
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
