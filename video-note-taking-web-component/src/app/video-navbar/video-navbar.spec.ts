import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoNavbar } from './video-navbar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('VideoNavbar', () => {
  let component: VideoNavbar;
  let fixture: ComponentFixture<VideoNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoNavbar],
      schemas: [CUSTOM_ELEMENTS_SCHEMA], // Használni az egyedi komponenseket.
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
