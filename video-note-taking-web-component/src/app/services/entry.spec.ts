import { TestBed } from '@angular/core/testing';
import { EntryService } from './entry';
import { Entry } from '../models/entry';

describe('EntryService', () => {
  let service: EntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EntryService] });
    service = TestBed.inject(EntryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getEntry returns default Entry', (done) => {
    service.getEntry().subscribe(entry => {
      expect(entry).toEqual(jasmine.any(Entry));
      expect(entry.entryId).toBe(0);
      expect(entry.timestamp).toBe('00:00:00.000');
      expect(entry.thumbnail).toBe('');
      done();
    });
  });

  it('setEntry updates entry$', (done) => {
    const e = new Entry('12:34:56.789', 'thumb.png');
    e.entryId = 5;
    e.title = 'Test';
    service.setEntry(e);

    service.getEntry().subscribe(entry => {
      expect(entry).toBe(e);
      expect(entry.entryId).toBe(5);
      expect(entry.title).toBe('Test');
      expect(entry.timestamp).toBe('12:34:56.789');
      expect(entry.thumbnail).toBe('thumb.png');
      done();
    });
  });

  it('resetEntry sets only timestamp and thumbnail on a new Entry', (done) => {
    const source = new Entry('01:02:03.004', 'orig.png');
    source.entryId = 7;
    source.title = 'Orig';
    service.setEntry(new Entry('00:00:00.000', 'x'));
    service.resetEntry(source);

    service.getEntry().subscribe(entry => {
      expect(entry.entryId).toBe(0);
      expect(entry.timestamp).toBe('01:02:03.004');
      expect(entry.thumbnail).toBe('orig.png');
      expect(entry.title).toBe('');
      done();
    });
  });

  it('edit entry observables work', (done) => {
    const e = new Entry('09:09:09.009', 'e.png');
    service.setEditEntry(e);
    service.getEditEntry().subscribe(edit => {
      expect(edit).toBe(e);
      done();
    });
  });

  it('edit mode observable toggles', (done) => {
    service.setEditMode(true);
    service.getEditMode().subscribe(mode => {
      expect(mode).toBeTrue();
      done();
    });
  });

  it('set/get array entries works', (done) => {
    const a = [new Entry('00:00:01','a.png'), new Entry('00:00:02','b.png')];
    service.setArrayEntry(a);
    service.getArrayEntry().subscribe(arr => {
      expect(arr).toBe(a);
      expect(arr.length).toBe(2);
      done();
    });
  });

  it('pushArrayEntry appends entry', (done) => {
    service.setArrayEntry([]);
    const newE = new Entry('00:00:03','n.png');
    newE.entryId = 11;
    service.pushArrayEntry(newE);

    service.getArrayEntry().subscribe(arr => {
      expect(arr.length).toBe(1);
      expect(arr[0]).toBe(newE);
      done();
    });
  });

  it('setArrayEntryById updates existing entry', (done) => {
    const e1 = new Entry('00:00:01','a'); e1.entryId = 100;
    const e2 = new Entry('00:00:02','b'); e2.entryId = 101;
    service.setArrayEntry([e1, e2]);

    const updated = new Entry('99:99:99','z'); updated.entryId = 101;
    service.setArrayEntryById(updated);

    service.getArrayEntry().subscribe(arr => {
      const found = arr.find(x => x.entryId === 101)!;
      expect(found).toBeDefined();
      expect(found.timestamp).toBe('99:99:99');
      expect(found.thumbnail).toBe('z');
      done();
    });
  });

  it('setArrayEntryById logs error when id not found', () => {
    spyOn(console, 'error');
    service.setArrayEntry([]);
    const updated = new Entry('t','x'); updated.entryId = 999;
    service.setArrayEntryById(updated);
    expect(console.error).toHaveBeenCalledWith('Entry with ID 999 not found.');
  });

  it('deleteById removes existing entry and calls resetEntry', (done) => {
    const e1 = new Entry('a','a.png'); e1.entryId = 10;
    const e2 = new Entry('b','b.png'); e2.entryId = 11;
    service.setArrayEntry([e1, e2]);

    spyOn(service, 'resetEntry').and.callThrough();

    service.deleteById(e1);

    service.getArrayEntry().subscribe(arr => {
      expect(arr.find(x => x.entryId === 10)).toBeUndefined();
      expect(service.resetEntry).toHaveBeenCalledWith(e1);
      done();
    });
  });

  it('deleteById logs error when entry not found', () => {
    spyOn(console, 'error');
    service.setArrayEntry([]);
    const toDelete = new Entry('x','x.png'); toDelete.entryId = 777;
    service.deleteById(toDelete);
    expect(console.error).toHaveBeenCalledWith('Entry with ID 777 not found for deletion.');
  });

  it('setCurrentEntryId updates currentEntryId$', (done) => {
    service.setCurrentEntryId(42);
    service.currentEntryId$.subscribe(id => {
      expect(id).toBe(42);
      done();
    });
  });
});
