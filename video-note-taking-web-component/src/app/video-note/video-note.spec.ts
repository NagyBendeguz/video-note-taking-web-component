import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoNote } from './video-note';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockTranslateService } from '../../test-utils/mock-translate.service';

describe('VideoNote', () => {
  let component: VideoNote;
  let fixture: ComponentFixture<VideoNote>;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });

    await TestBed.configureTestingModule({
      declarations: [VideoNote],
      imports: [TranslateModule.forRoot()],
      providers: [{ provide: TranslateService, useValue: mockTranslate }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoNote);
    component = fixture.componentInstance;

    (component as any).settings$ = settingsSubject.asObservable();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
