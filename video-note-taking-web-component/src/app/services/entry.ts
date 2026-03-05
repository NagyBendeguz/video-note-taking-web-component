import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Entry } from '../models/entry';

@Injectable({
  providedIn: 'root',
})
export class EntryService {
  private entrySource = new BehaviorSubject<Entry>(new Entry());
  entry$ = this.entrySource.asObservable();

  private editEntrySource = new BehaviorSubject<Entry>(new Entry());
  editEntry$ = this.editEntrySource.asObservable();

  private editModeSource = new BehaviorSubject<boolean>(false);
  editMode$ = this.editModeSource.asObservable();

  private arrayEntrySource = new BehaviorSubject<Array<Entry>>(new Array<Entry>());
  arrayEntry$ = this.arrayEntrySource.asObservable();

  getEntry(): Observable<Entry> {
    return this.entry$;
  }

  setEntry(entry: Entry): void {
    this.entrySource.next(entry);
  }

  resetEntry(entry: Entry): void {
    this.entrySource.next(new Entry(entry.thumbnail, entry.timestamp));
  }

  getEditEntry(): Observable<Entry> {
    return this.editEntry$;
  }

  setEditEntry(editEntry: Entry): void {
    this.editEntrySource.next(editEntry);
  }

  getEditMode(): Observable<boolean> {
    return this.editMode$;
  }

  setEditMode(editMode: boolean): void {
    this.editModeSource.next(editMode);
  }

  getArrayEntry(): Observable<Array<Entry>> {
    return this.arrayEntry$;
  }

  setArrayEntry(arrayEntry: Array<Entry>): void {
    this.arrayEntrySource.next(arrayEntry);
  }

  pushArrayEntry(newEntry: Entry): void {
    const currentArray = this.arrayEntrySource.getValue();
    currentArray.push(newEntry);
    this.arrayEntrySource.next(currentArray);
  }

  setArrayEntryById(updatedEntry: Entry): void {
    const currentArray = this.arrayEntrySource.getValue();
    const entryIndex = currentArray.findIndex(entry => entry.entryId === updatedEntry.entryId);

    if (entryIndex !== -1)
    {
      currentArray[entryIndex] = updatedEntry;
      this.arrayEntrySource.next(currentArray);
    }
    else
    {
      console.error(`Entry with ID ${updatedEntry.entryId} not found.`);
    }
  }

  deleteById(entryToDelete: Entry): void {
    const currentArray = this.arrayEntrySource.getValue();
    const filteredArray = currentArray.filter(entry => entry.entryId !== entryToDelete.entryId);

    if (filteredArray.length === currentArray.length)
    {
      console.error(`Entry with ID ${entryToDelete.entryId} not found for deletion.`);
    }
    else
    {
      this.arrayEntrySource.next(filteredArray);
      this.resetEntry(entryToDelete);
    }
  }
}
