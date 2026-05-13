import { EditingView } from './editing-view';
import { ElementRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { Entry } from '../models/entry';
import DOMPurify from 'dompurify';

class MockEntryService {
  entry$ = new Subject<Entry>();
  editEntry$ = new Subject<any>();
  currentEntryId$ = new Subject<number>();
  getArrayEntry = () => of([]);
  getEntry = () => of(new Entry());
  setEntry = jasmine.createSpy('setEntry');
  setArrayEntryById = jasmine.createSpy('setArrayEntryById');
  setEditMode = jasmine.createSpy('setEditMode');
  pushArrayEntry = jasmine.createSpy('pushArrayEntry');
  setCurrentEntryId = jasmine.createSpy('setCurrentEntryId');
  resetEntry = jasmine.createSpy('resetEntry');
}

class MockVideoService {
  currentTime$ = new Subject<number>();
  thumbnail$ = new Subject<string>();
  isActive$ = new Subject<boolean>();
  isNote$ = new Subject<boolean>();
  emitRewind = jasmine.createSpy('emitRewind');
  emitForward = jasmine.createSpy('emitForward');
  setNote = jasmine.createSpy('setNote');
  setPlaying = jasmine.createSpy('setPlaying');
}

class MockPdfService {
  generatePDF = jasmine.createSpy('generatePDF');
}

class MockSettingsService {
  settings$ = new Subject<any>();
}

class MockTranslate {
  instant = (k: string) => k;
}

function createElementRef<T extends HTMLElement>(tag = 'input'): ElementRef<T> {
  const el = document.createElement(tag) as T;
  document.body.appendChild(el);
  return new ElementRef<T>(el);
}

describe('EditingView', () => {
  let component: EditingView;
  let entryService: MockEntryService;
  let videoService: MockVideoService;
  let settingsService: MockSettingsService;
  let pdfService: MockPdfService;

  beforeEach(() => {
    entryService = new MockEntryService();
    videoService = new MockVideoService();
    settingsService = new MockSettingsService();
    pdfService = new MockPdfService();

    component = new EditingView(
      entryService as any,
      videoService as any,
      settingsService as any,
      pdfService as any,
      new MockTranslate() as any
    );

    component.inputTitle = createElementRef<HTMLInputElement>('input');
    component.textarea = createElementRef<HTMLTextAreaElement>('textarea');

    component.settings = {
      thumbnailRewindRate: 1,
      thumbnailForwardRate: 2,
      startVideoOnSave: false,
      confirmCancel: false,
      saveSettings: false,
      shortcuts: {
        thumbnailMoveRewind: 'r',
        thumbnailMoveForward: 'f',
        save: 's',
        cancel: 'c',
        bold: 'b',
        italic: 'i',
        strikethrough: 't',
        orderedList: 'o',
        unorderedList: 'u'
      }
    } as any;
  });

  afterEach(() => {
    document.querySelectorAll('input,textarea,a').forEach(n => n.remove());
  });

  it('ngOnInit adds keydown listener', () => {
    spyOn(window, 'addEventListener');
    component.ngOnInit();
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', (component as any).keyHandler);
  });

  it('ngOnDestroy removes keydown listener and completes unsubscribe', () => {
    spyOn(window, 'removeEventListener');
    component.ngOnInit();
    component.ngOnDestroy();
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', (component as any).keyHandler);
  });

  it('addTitle sanitizes and sets entry.title when <=50 chars', () => {
    spyOn(DOMPurify as any, 'sanitize').and.callFake((s: string) => s.replace(/<.*?>/g, ''));
    component.entry = new Entry();
    const ev = { target: { value: '<b>test</b>' } } as unknown as Event;
    component.addTitle(ev);
    expect(component.entry.title).toBe('test');
  });

  it('addNote calls addNoteFormat with input value', () => {
    component.entry = new Entry();
    const addNoteFormatSpy = spyOn(component as any, 'addNoteFormat').and.stub();

    const event = { target: { value: '**bold**\nline' } } as unknown as Event;
    component.addNote(event);

    expect(addNoteFormatSpy).toHaveBeenCalledWith('**bold**\nline');
  });

  it('modifyText inserts formatting when no selection', () => {
    component.entry.formattedNoteMD = 'HelloWorld';
    const ta = component.textarea.nativeElement;
    ta.value = component.entry.formattedNoteMD;
    ta.selectionStart = 5;
    ta.selectionEnd = 5;
    (component as any).modifyText('*', '*');
    expect(component.entry.formattedNoteMD).toBe('Hello**World');
    expect(ta.value).toBe(component.entry.formattedNoteMD);
  });

  it('cleanNoteFromMD strips markdown tokens', () => {
    const raw = '**bold** _italic_ ~~strike~~ `code`';
    const out = (component as any).cleanNoteFromMD(raw);
    expect(out).toBe('bold italic strike code');
  });

  it('formatVideoTimestamp returns expected format', () => {
    const formatted = (component as any).formatVideoTimestamp(3661.234);
    expect(formatted).toBe('01:01:01.233');
  });

  it('editingRewind and editingForward call videoService methods with rates', () => {
    component.editingRewind();
    component.editingForward();
    expect(videoService.emitRewind).toHaveBeenCalledWith(component.settings.thumbnailRewindRate);
    expect(videoService.emitForward).toHaveBeenCalledWith(component.settings.thumbnailForwardRate);
  });

  it('saveEntry pushes new entry when not editMode and has content', () => {
    component.editMode = false;
    component.entry = new Entry();
    component.entry.title = 't';
    (component as any).currentEntryId = 5;
    component.saveEntry();
    expect(entryService.pushArrayEntry).toHaveBeenCalled();
    expect(entryService.setCurrentEntryId).toHaveBeenCalledWith(6);
    expect((component as any).currentOrderedListNumber).toBe(1);
  });

  it('confirmCancel resets entry and disables editMode', () => {
    component.entry = new Entry('00:00:00.000', 'thumb');
    component.entry.title = 'x';
    component.editMode = true;
    component.confirmCancel();
    expect(component.editMode).toBeFalse();
    expect(entryService.resetEntry).toHaveBeenCalled();
    expect(component.showModal).toBeFalse();
  });

  it('saveNote calls downloadJSON with settings when saveSettings true', () => {
    (component as any).note = [{ entryId: 1 }];
    component.settings.saveSettings = true;
    spyOn(component as any, 'downloadJSON');
    component.saveNote();
    expect((component as any).downloadJSON).toHaveBeenCalled();
    const calledWith = (component as any).downloadJSON.calls.argsFor(0)[0];
    expect(calledWith.entries).toBeDefined();
    expect(calledWith.settings).toBeDefined();
  });

  it('exportNote calls pdfService.generatePDF', () => {
    (component as any).note = [{ entryId: 1 }];
    component.exportNote();
    expect(pdfService.generatePDF).toHaveBeenCalledWith((component as any).note);
  });

  it('downloadJSON creates anchor, clicks and revokes object URL', () => {
    const blobUrl = 'blob:fake';
    spyOn(URL, 'createObjectURL').and.returnValue(blobUrl);
    spyOn(URL, 'revokeObjectURL');
    const appendSpy = spyOn(document.body, 'appendChild').and.callThrough();
    const removeSpy = spyOn(document.body, 'removeChild').and.callThrough();
    (component as any).downloadJSON({ a: 1 });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(blobUrl);
  });

  describe('keyHandler all branches', () => {
    beforeEach(() => {
      (component as any).isActive = true;
      component.settings.shortcuts = {
        thumbnailMoveRewind: 'r',
        thumbnailMoveForward: 'f',
        save: 's',
        cancel: 'c',
        bold: 'b',
        italic: 'i',
        strikethrough: 't',
        orderedList: 'o',
        unorderedList: 'u'
      } as any;
    });

    function makeEvent(key: string) {
      return new KeyboardEvent('keydown', { shiftKey: true, key });
    }

    it('handles thumbnail rewind (shortcut r)', () => {
      const ev = makeEvent('R');
      spyOn(component, 'editingRewind');
      (component as any).keyHandler(ev);
      expect(component.editingRewind).toHaveBeenCalled();
    });

    it('handles thumbnail forward (shortcut f)', () => {
      const ev = makeEvent('F');
      spyOn(component, 'editingForward');
      (component as any).keyHandler(ev);
      expect(component.editingForward).toHaveBeenCalled();
    });

    it('handles save (shortcut s)', () => {
      const ev = makeEvent('S');
      spyOn(component, 'saveEntry');
      (component as any).keyHandler(ev);
      expect(component.saveEntry).toHaveBeenCalled();
    });

    it('handles cancel (shortcut c)', () => {
      const ev = makeEvent('C');
      spyOn(component, 'cancelEntry');
      (component as any).keyHandler(ev);
      expect(component.cancelEntry).toHaveBeenCalled();
    });

    it('handles bold (shortcut b)', () => {
      const ev = makeEvent('B');
      spyOn(component, 'bold');
      (component as any).keyHandler(ev);
      expect(component.bold).toHaveBeenCalled();
    });

    it('handles italic (shortcut i)', () => {
      const ev = makeEvent('I');
      spyOn(component, 'italic');
      (component as any).keyHandler(ev);
      expect(component.italic).toHaveBeenCalled();
    });

    it('handles strikethrough (shortcut t)', () => {
      const ev = makeEvent('T');
      spyOn(component, 'strikethrough');
      (component as any).keyHandler(ev);
      expect(component.strikethrough).toHaveBeenCalled();
    });

    it('handles ordered list (shortcut o)', () => {
      const ev = makeEvent('O');
      spyOn(component, 'orderedList');
      (component as any).keyHandler(ev);
      expect(component.orderedList).toHaveBeenCalled();
    });

    it('handles unordered list (shortcut u)', () => {
      const ev = makeEvent('U');
      spyOn(component, 'unorderedList');
      (component as any).keyHandler(ev);
      expect(component.unorderedList).toHaveBeenCalled();
    });

    it('does nothing if not active', () => {
      (component as any).isActive = false;
      const ev = makeEvent('R');
      spyOn(component, 'editingRewind');
      (component as any).keyHandler(ev);
      expect(component.editingRewind).not.toHaveBeenCalled();
    });

    it('prevents default and stops propagation when matching shortcut', () => {
      const ev = makeEvent('S');
      const spyPrevent = spyOn(ev, 'preventDefault');
      const spyStop = spyOn((ev as any), 'stopImmediatePropagation');
      (component as any).keyHandler(ev);
      expect(spyPrevent).toHaveBeenCalled();
      expect(spyStop).toHaveBeenCalled();
    });
  });

  it('orderedList increments currentOrderedListNumber', () => {
    component.entry.formattedNoteMD = '';
    component.textarea.nativeElement.selectionStart = 0;
    component.textarea.nativeElement.selectionEnd = 0;
    (component as any).currentOrderedListNumber = 3;
    component.orderedList();
    expect((component as any).currentOrderedListNumber).toBe(4);
  });
});
