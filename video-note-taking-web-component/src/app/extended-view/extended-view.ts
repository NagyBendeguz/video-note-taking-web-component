import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';

@Component({
  selector: 'app-extended-view',
  standalone: false,
  templateUrl: './extended-view.html',
  styleUrl: './extended-view.sass',
})
export class ExtendedView {
  entry$: Observable<Entry> = new Observable<Entry>();
  entryLocal: Entry = new Entry();

  constructor(private entryService: EntryService) {}

  ngAfterViewInit(): void {
    this.entry$ = this.entryService.getEntry();

    this.entryService.entry$.subscribe(currentEntry => {
      this.entryLocal = currentEntry;
    });
  }

  editEntry(): void {
    
  }

  deleteEntry(): void {

  }
}
