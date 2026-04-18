import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExtendedView } from './extended-view';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Entry } from '../models/entry';
import { Settings } from '../models/settings';

class MockVideoService {
  setTimestamp = jasmine.createSpy('setTimestamp');
  emitJumpToTimestamp = jasmine.createSpy('emitJumpToTimestamp');
}

class MockEntryService {
  private editModeSubject = new BehaviorSubject<boolean>(false);
  editMode$ = this.editModeSubject.asObservable();
  getEditMode = () => this.editModeSubject.asObservable();
  setEditEntry = jasmine.createSpy('setEditEntry');
  setEditMode = jasmine.createSpy('setEditMode');
  deleteById = jasmine.createSpy('deleteById');
  // A szerkesztési mód ki-be kapcsolásához.
  setEditModeValue(v: boolean) { this.editModeSubject.next(v); }
}

class MockSettingsService {
  private settingsSubject = new BehaviorSubject<Settings>(new Settings());
  settings$ = this.settingsSubject.asObservable();
  getSettings = () => this.settingsSubject.asObservable();
  setSettingsValue(s: Settings) { this.settingsSubject.next(s); }
}

class MockTranslateService {
  instant = (k: string) => k;
  get = (k: string) => of(k);
}

describe('ExtendedView', () => {
  let fixture: ComponentFixture<ExtendedView>;
  let component: ExtendedView;
  let videoService: MockVideoService;
  let entryService: MockEntryService;
  let settingsService: MockSettingsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtendedView],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: 'VideoService', useClass: MockVideoService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    videoService = new MockVideoService();
    entryService = new MockEntryService();
    settingsService = new MockSettingsService();

    fixture = TestBed.createComponent(ExtendedView);
    component = fixture.componentInstance;

    // A mock service-ket manuálisan hozzárendelni a konstruktor paramétereihez.
    (component as any).videoService = videoService;
    (component as any).entryService = entryService;
    (component as any).settingsSerivce = settingsService;
    (component as any).translate = new MockTranslateService();

    // Egy bejegyzés hozzáadása.
    component.entry = Object.assign(new Entry(), { entryId: 42, timestamp: '00:01:23.456', title: 'T', thumbnail: 'image.jpg', noteWithBr: 'n', formattedNoteHTML: '<b>n</b>' });
    component.arrayEntry$.next([component.entry]);

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit subscribes to editMode$ and settings$', () => {
    // Az editMode kezdeti értéke hamis.
    expect(component.editMode).toBeFalse();

    // A szerkesztői mód bekapcsolása.
    entryService.setEditModeValue(true);

    fixture.detectChanges();
    expect(component.editMode).toBeTrue();

    // Beállítások frissítése.
    const s = new Settings();
    s.confirmDelete = true;
    settingsService.setSettingsValue(s);
    fixture.detectChanges();
    expect(component.settings.confirmDelete).toBeTrue();
  });

  it('editEntry should set edit entry and edit mode via service', () => {
    component.editEntry();
    expect(entryService.setEditEntry).toHaveBeenCalledWith(component.entry);
    expect(entryService.setEditMode).toHaveBeenCalledWith(true);
  });

  it('jumpToTimestamp should call video service methods', () => {
    component.jumpToTimestamp();
    expect(videoService.setTimestamp).toHaveBeenCalledWith(component.entry.timestamp);
    expect(videoService.emitJumpToTimestamp).toHaveBeenCalled();
  });

  it('close should emit onClose', (done) => {
    component.onClose.subscribe(() => done());
    component.close();
  });

  describe('delete flows', () => {
    beforeEach(() => {
      // A beállításnak a confirmDelete alapértelmezett értéke az igaz legyen.
      const s = new Settings();
      s.confirmDelete = true;
      settingsService.setSettingsValue(s);
      fixture.detectChanges();
    });

    it('deleteEntry opens modal when not in editMode and confirmDelete true', () => {
      entryService.setEditModeValue(false);
      component.showModal = false;
      component.deleteEntry();
      expect(component.showModal).toBeTrue();
    });

    it('deleteEntry calls confirmDelete directly when editMode true', () => {
      spyOn(component, 'confirmDelete');
      entryService.setEditModeValue(true);
      component.deleteEntry();
      expect(component.confirmDelete).toHaveBeenCalled();
    });

    it('deleteEntry calls confirmDelete directly when confirmDelete false', () => {
      const s = new Settings();
      s.confirmDelete = false;
      settingsService.setSettingsValue(s);
      fixture.detectChanges();
      spyOn(component, 'confirmDelete');
      entryService.setEditModeValue(false);
      component.deleteEntry();
      expect(component.confirmDelete).toHaveBeenCalled();
    });

    it('confirmDelete removes entry from arrayEntry$, calls service deleteById and closes modal', () => {
      // Több bejegyzés meghívása.
      const e1 = Object.assign(new Entry(), { entryId: 1 });
      const e2 = Object.assign(new Entry(), { entryId: 42 });
      component.arrayEntry$.next([e1, e2]);
      component.isExtendedViews.set('42', true);

      component.confirmDelete();

      // A service meghívása.
      expect(entryService.deleteById).toHaveBeenCalledWith(component.entry);

      // A 42-es entryId-val rendelkező bejegyzés törlése.
      expect(component.isExtendedViews.has('42')).toBeFalse();

      // Az arrayEntry$ frissítve, hogy ne tartalmazza a 42-es entryId-t.
      const arr = component.arrayEntry$.getValue();
      expect(arr.find(item => item.entryId === 42)).toBeUndefined();

      // A modal becsukva.
      expect(component.showModal).toBeFalse();
    });

    it('cancelDelete closes modal without deleting', () => {
      component.showModal = true;
      component.cancelDelete();

      expect(component.showModal).toBeFalse();
      expect(entryService.deleteById).not.toHaveBeenCalled();
    });
  });

  it('ngOnDestroy completes unsubscribe', () => {
    // Az ngOnDestroy meghívása és hiba nélkül leiratkozás.
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
