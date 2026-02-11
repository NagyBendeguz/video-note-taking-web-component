import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPlayer } from './video-player';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VideoPlayer', () => {
  let component: VideoPlayer;
  let fixture: ComponentFixture<VideoPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoPlayer],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Használni az egyedi komponenseket.
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
