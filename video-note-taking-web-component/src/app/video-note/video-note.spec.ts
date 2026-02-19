import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoNote } from './video-note';

describe('VideoNote', () => {
  let component: VideoNote;
  let fixture: ComponentFixture<VideoNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoNote]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoNote);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
