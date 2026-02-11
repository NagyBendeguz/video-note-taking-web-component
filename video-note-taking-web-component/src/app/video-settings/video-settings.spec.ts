import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoSettings } from './video-settings';

describe('VideoSettings', () => {
  let component: VideoSettings;
  let fixture: ComponentFixture<VideoSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoSettings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
