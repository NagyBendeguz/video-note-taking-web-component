import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoNote } from './video-note';
import { CUSTOM_ELEMENTS_SCHEMA, DebugElement } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';

interface Entry { entryId: string; title?: string; }

class MockEntryService {
  private subject = new BehaviorSubject<Entry[]>([]);
  getArrayEntry() { return this.subject.asObservable(); }
  setEntries(entries: Entry[]) { this.subject.next(entries); }
}

describe('VideoNote', () => {
  let fixture: ComponentFixture<VideoNote>;
  let component: VideoNote;
  let entryService: MockEntryService;

  beforeEach(async () => {
    entryService = new MockEntryService();

    await TestBed.configureTestingModule({
      declarations: [VideoNote],
      providers: [{ provide: (VideoNote as any).ɵprov ? (VideoNote as any).ɵprov : VideoNote, useValue: VideoNote }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(VideoNote);
    component = fixture.componentInstance;

    (component as any).entryService = entryService as any;

    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('toggleView toggles isExtendedViews map value for given id', () => {
    const id = 'abc';
    expect(component.isExtendedViews.get(id)).toBeUndefined();
    component.toggleView(id);
    expect(component.isExtendedViews.get(id)).toBeTrue();
    component.toggleView(id);
    expect(component.isExtendedViews.get(id)).toBeFalse();
  });

  it('renders compressed-view elements for entries and responds to onToggle output', () => {
    const entries: Entry[] = [
      { entryId: 'a1', title: 'one' },
      { entryId: 'b2', title: 'two' }
    ];
    component.ngOnInit();
    entryService.setEntries(entries);
    fixture.detectChanges();

    const compressedEls: DebugElement[] = fixture.debugElement.queryAll(By.css('compressed-view'));
    expect(compressedEls.length).toBe(2);

    expect(component.isExtendedViews.get('a1')).toBeUndefined();

    compressedEls[0].triggerEventHandler('onToggle', null);
    expect(component.isExtendedViews.get('a1')).toBeTrue();

    compressedEls[0].triggerEventHandler('onToggle', null);
    expect(component.isExtendedViews.get('a1')).toBeFalse();
  });
});
