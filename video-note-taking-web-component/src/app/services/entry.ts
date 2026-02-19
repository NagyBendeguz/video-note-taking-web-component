import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Entry } from '../models/entry';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  private entrySource = new BehaviorSubject<Entry>(new Entry());
  entry$ = this.entrySource.asObservable();

  getEntry(): Observable<Entry> {
    return this.entry$;
  }

  setEntry(entry: Entry): void {
    this.entrySource.next(entry);
  }
}
