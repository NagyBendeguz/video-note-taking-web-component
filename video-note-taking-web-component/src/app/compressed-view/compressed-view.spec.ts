import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompressedView } from './compressed-view';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { VideoService } from '../services/video';
import { SettingsService } from '../services/settings';
import { Entry } from '../models/entry';
import { Settings } from '../models/settings';

describe('CompressedView', () => {
  let component: CompressedView;
  let fixture: ComponentFixture<CompressedView>;

  let videoServiceSpy: jasmine.SpyObj<VideoService>;
  let settingsServiceSpy: jasmine.SpyObj<SettingsService>;

  beforeEach(async () => {
    videoServiceSpy = jasmine.createSpyObj('VideoService', ['setTimestamp', 'emitJumpToTimestamp']);
    settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getSettings']);

    await TestBed.configureTestingModule({
      declarations: [CompressedView],
      providers: [
        { provide: VideoService, useValue: videoServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CompressedView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should subscribe settings$ from getSettings', () => {
    const fakeSettings: Settings = new Settings();
    const settings$ = of(fakeSettings);
    settingsServiceSpy.getSettings.and.returnValue(settings$);

    component.ngOnInit();

    let received: Settings | undefined;
    component.settings$.subscribe(s => (received = s));

    expect(received).toBe(fakeSettings);
    expect(settingsServiceSpy.getSettings).toHaveBeenCalled();
  });

  it('toggle() should emit onToggle event', () => {
    spyOn(component.onToggle, 'emit');
    component.toggle();

    expect(component.onToggle.emit).toHaveBeenCalledTimes(1);
  });

  it('jumpToTimestamp() should call setTimestamp and emitJumpToTimestamp', () => {
    // Az alapértelmezett időbélyeg: 00:00:00.000
    component.entry = new Entry();

    component.jumpToTimestamp();

    expect(videoServiceSpy.setTimestamp).toHaveBeenCalledWith("00:00:00.000");
    expect(videoServiceSpy.emitJumpToTimestamp).toHaveBeenCalled();
  });
});
