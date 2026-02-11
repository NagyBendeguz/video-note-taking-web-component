import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { App } from './app';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([])
      ],
      declarations: [
        App
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Használni az egyedi komponenseket.
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render video-player-element', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const videoPlayerElement = fixture.nativeElement.querySelector('video-player-element');
    expect(videoPlayerElement).not.toBeNull();
  });
});
