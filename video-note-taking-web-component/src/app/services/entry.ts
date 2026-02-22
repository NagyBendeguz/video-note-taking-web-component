import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Entry } from '../models/entry';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  private entrySource = new BehaviorSubject<Entry>(new Entry());
  entry$ = this.entrySource.asObservable();

  private arrayEntrySource = new BehaviorSubject<Array<Entry>>(new Array<Entry>());
  arrayEntry$ = this.arrayEntrySource.asObservable();

  getEntry(): Observable<Entry> {
    return this.entry$;
  }

  setEntry(entry: Entry): void {
    this.entrySource.next(entry);
  }

  getArrayEntry(): Observable<Array<Entry>> {
    return this.arrayEntry$;
  }

  setArrayEntry(arrayEntry: Array<Entry>): void {
    this.arrayEntrySource.next(arrayEntry);
  }

  /*pushArrayEntry(newEntry: Entry): void {
    const currentArray = this.arrayEntrySource.getValue();
    currentArray.push(newEntry);
    this.arrayEntrySource.next(currentArray);
  }*/
}
