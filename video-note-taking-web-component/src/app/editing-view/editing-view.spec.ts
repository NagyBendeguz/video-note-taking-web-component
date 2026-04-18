import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditingView } from './editing-view';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MockTranslateService } from '../../test-utils/mock-translate.service';
import { Entry } from '../models/entry';
import DOMPurify from 'dompurify';

class MockEntryService {
  entry$ = new BehaviorSubject<Entry>(new Entry());
  editEntry$ = new BehaviorSubject<Entry>({ entryId: 0 } as any);
  currentEntryId$ = new BehaviorSubject<number>(0);
  private arrayEntry = new BehaviorSubject<any[]>([]);
  getEntry() { return this.entry$.asObservable(); }
  getArrayEntry() { return this.arrayEntry.asObservable(); }
  setEntry(e: Entry) { this.entry$.next(e); }
  setEditMode() {}
  setArrayEntryById(e: Entry) {}
  pushArrayEntry(e: Entry) { const arr = this.arrayEntry.getValue(); arr.push(e); this.arrayEntry.next(arr); }
  setCurrentEntryId(id: number) { this.currentEntryId$.next(id); }
  resetEntry(e: Entry) { this.entry$.next(e); }
}

class MockVideoService {
  currentTime$ = new BehaviorSubject<number>(0);
  thumbnail$ = new BehaviorSubject<string>('');
  isNote$ = new BehaviorSubject<boolean>(false);
  emitRewind = jasmine.createSpy('emitRewind');
  emitForward = jasmine.createSpy('emitForward');
  setNote = jasmine.createSpy('setNote');
  setPlaying = jasmine.createSpy('setPlaying');
}

class MockPdfService {
  generatePDF = jasmine.createSpy('generatePDF');
}

class MockSettingsService {
  settings$ = new BehaviorSubject<any>({
    thumbnailRewindRate: 1,
    thumbnailForwardRate: 1,
    startVideoOnSave: false,
    confirmCancel: false,
    shortcuts: {
      thumbnailMoveRewind: 'r',
      thumbnailMoveForward: 'f',
      save: 's',
      cancel: 'c',
      bold: 'b',
      italic: 'i',
      strikethrough: 'h',
      orderedList: 'o',
      unorderedList: 'u',
    }
  });
}

describe('EditingView', () => {
  let component: EditingView;
  let fixture: ComponentFixture<EditingView>;
  let mockTranslate: MockTranslateService;
  let settingsSubject: BehaviorSubject<{ language: string }>;
  let entryService: MockEntryService;
  let videoService: MockVideoService;
  let pdfService: MockPdfService;
  let settingsService: MockSettingsService;

  beforeEach(async () => {
    mockTranslate = new MockTranslateService();
    settingsSubject = new BehaviorSubject({ language: 'en' });
    entryService = new MockEntryService();
    videoService = new MockVideoService();
    pdfService = new MockPdfService();
    settingsService = new MockSettingsService();

    await TestBed.configureTestingModule({
      declarations: [EditingView],
      imports: [TranslateModule.forRoot()],
      providers: [
        { provide: 'EntryService', useValue: entryService },
        { provide: 'VideoService', useValue: videoService },
        { provide: 'PdfService', useValue: pdfService },
        { provide: 'SettingsService', useValue: settingsService },
        { provide: TranslateService, useValue: mockTranslate },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).overrideProvider('EntryService', { useValue: entryService })
      .overrideProvider('VideoService', { useValue: videoService })
      .overrideProvider('PdfService', { useValue: pdfService })
      .overrideProvider('SettingsService', { useValue: settingsService })
      .compileComponents();

    fixture = TestBed.createComponent(EditingView);
    component = fixture.componentInstance;

    (component as any).settings$ = settingsSubject.asObservable();
    (component as any).entryService = entryService as any;
    (component as any).videoService = videoService as any;
    (component as any).pdfService = pdfService as any;
    (component as any).settingsSerivce = settingsService as any;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('subscribe to services after create', () => {
    expect(component.entry).toBeDefined();
  });

  it('editingRewind and editingForward call video service with rates', () => {
    component.editingRewind();
    expect(videoService.emitRewind).toHaveBeenCalledWith(settingsService.settings$.value.thumbnailRewindRate);

    component.editingForward();
    expect(videoService.emitForward).toHaveBeenCalledWith(settingsService.settings$.value.thumbnailForwardRate);
  });

  it('addTitle sanitizes and sets entry.title when under length', () => {
    const ev = { target: { value: '<img src=x onerror=alert(1)>Hello' } } as any;
    spyOn(DOMPurify, 'sanitize').and.callThrough();
    component.addTitle(ev);
    expect(DOMPurify.sanitize).toHaveBeenCalledWith(ev.target.value);
    expect(component.entry.title).toContain('Hello');
  });

  it('addTitle ignores values > 50 chars', () => {
    const long = 'a'.repeat(51);
    component.entry.title = '';
    component.addTitle({ target: { value: long } } as any);
    expect(component.entry.title).toBe('');
  });

  it('addNote updates formatted and plain note fields', () => {
    const input = '**bold**\nline2';
    component.addNote({ target: { value: input } } as any);
    expect(component.entry.formattedNoteMD).toBeDefined();
    expect(component.entry.note).toContain('bold');
  });

  it('modifyText wraps selection or inserts markers', () => {
    const ta = document.createElement('textarea');
    ta.id = 'note';
    document.body.appendChild(ta);

    component.entry.formattedNoteMD = 'HelloWorld';

    ta.value = component.entry.formattedNoteMD;
    ta.selectionStart = 5;
    ta.selectionEnd = 5;

    component.bold();

    expect(component.entry.formattedNoteMD).toContain('**');

    document.body.removeChild(ta);
  });

  it('orderedList increments numbering and unorderedList inserts dash', () => {
    const ta = document.createElement('textarea');
    ta.id = 'note';
    document.body.appendChild(ta);

    component.entry.formattedNoteMD = 'Item';
    ta.value = component.entry.formattedNoteMD;
    ta.selectionStart = ta.selectionEnd = component.entry.formattedNoteMD.length;

    component.orderedList();
    expect(component.entry.formattedNoteMD).toContain('1.');

    component.unorderedList();
    expect(component.entry.formattedNoteMD).toContain('-');

    document.body.removeChild(ta);
  });

  it('saveEntry in edit mode calls setArrayEntryById and resets editMode', () => {
    component.editMode = true;
    component.entry.entryId = 42;
    const spy = spyOn(entryService, 'setArrayEntryById');
    component.saveEntry();
    expect(spy).toHaveBeenCalledWith(component.entry);
    expect(component.editMode).toBeFalse();
  });

  it('cancelEntry shows modal depending on settings.confirmCancel', () => {
    settingsService.settings$.next({ ...settingsService.settings$.value, confirmCancel: true });
    component.cancelEntry();
    expect(component.showModal).toBeTrue();

    settingsService.settings$.next({ ...settingsService.settings$.value, confirmCancel: false });
    component.showModal = false;
    component.cancelEntry();
    expect(component.showModal).toBeFalse();
  });

  it('confirmCancel resets entry when there is content and resets edit mode', () => {
    component.entry.title = 'X';
    component.editMode = true;
    spyOn(entryService, 'resetEntry');
    component.confirmCancel();
    expect(component.editMode).toBeFalse();
    expect(entryService.resetEntry).toHaveBeenCalled();
  });

  it('saveNote triggers downloadJSON (creates anchor and clicks)', () => {
    // spy on createObjectURL and revokeObjectURL
    const createSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:123');
    const revokeSpy = spyOn(URL, 'revokeObjectURL');
    const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
    const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();
    // spy on click via Element.prototype
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

    component.saveNote();

    expect(createSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob:123');
  });

  it('exportNote calls pdfService.generatePDF', () => {
    component.exportNote();
    expect(pdfService.generatePDF).toHaveBeenCalledWith([]);
  });

  it('formatVideoTimestamp formats various times correctly', () => {
    const fn: any = (component as any).formatVideoTimestamp.bind(component);
    expect(fn(0)).toBe('00:00:00.000');
    expect(fn(1.234)).toMatch(/^00:00:01\.23/);
    expect(fn(3661.005)).toBe('01:01:01.005');
  });

  it('keyboard shortcuts call appropriate methods', () => {
    spyOn(component as any, 'editingRewind');
    spyOn(component as any, 'editingForward');
    spyOn(component as any, 'saveEntry');
    spyOn(component as any, 'cancelEntry');
    spyOn(component as any, 'bold');
    spyOn(component as any, 'italic');
    spyOn(component as any, 'strikethrough');
    spyOn(component as any, 'orderedList');
    spyOn(component as any, 'unorderedList');

    const shortcuts = settingsService.settings$.value.shortcuts;

    const dispatch = (key: string) => {
      const ev = new KeyboardEvent('keydown', { key, shiftKey: true });
      window.dispatchEvent(ev);
    };

    dispatch(shortcuts.thumbnailMoveRewind);
    expect((component as any).editingRewind).toHaveBeenCalled();

    dispatch(shortcuts.thumbnailMoveForward);
    expect((component as any).editingForward).toHaveBeenCalled();

    dispatch(shortcuts.save);
    expect((component as any).saveEntry).toHaveBeenCalled();

    dispatch(shortcuts.cancel);
    expect((component as any).cancelEntry).toHaveBeenCalled();

    dispatch(shortcuts.bold);
    expect((component as any).bold).toHaveBeenCalled();

    dispatch(shortcuts.italic);
    expect((component as any).italic).toHaveBeenCalled();

    dispatch(shortcuts.strikethrough);
    expect((component as any).strikethrough).toHaveBeenCalled();

    dispatch(shortcuts.orderedList);
    expect((component as any).orderedList).toHaveBeenCalled();

    dispatch(shortcuts.unorderedList);
    expect((component as any).unorderedList).toHaveBeenCalled();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });
});
