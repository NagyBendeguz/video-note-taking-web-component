import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoSettings } from './video-settings';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockTranslateService } from '../../test-utils/mock-translate.service';
import { MockTranslatePipe } from '../../test-utils/mock-translate.pipe';

describe('VideoSettings', () => {
  let component: VideoSettings;
  let fixture: ComponentFixture<VideoSettings>;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });

    await TestBed.configureTestingModule({
      declarations: [VideoSettings],
      imports: [MockTranslatePipe],
      providers: [{ provide: TranslateService, useValue: mockTranslate }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoSettings);
    component = fixture.componentInstance;

    (component as any).settings$ = settingsSubject.asObservable();
    component.langs = [
      { code: 'en', label: 'English' },
      { code: 'hu', label: 'Magyar' }
    ];

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
