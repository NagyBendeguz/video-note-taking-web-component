import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoNavbar } from './video-navbar';

describe('VideoNavbar', () => {
  let component: VideoNavbar;
  let fixture: ComponentFixture<VideoNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoNavbar]
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
