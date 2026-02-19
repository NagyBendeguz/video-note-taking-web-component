import { Component } from '@angular/core';
import { Entry } from '../models/entry';
import { Observable } from 'rxjs';
import { EntryService } from '../services/entry';

@Component({
  selector: 'app-compressed-view',
  standalone: false,
  templateUrl: './compressed-view.html',
  styleUrl: './compressed-view.sass',
})
export class CompressedView {
  entry$: Observable<Entry> = new Observable<Entry>();
  entryLocal: Entry = new Entry();

  constructor(private entryService: EntryService) {}

  ngAfterViewInit(): void {
    this.entry$ = this.entryService.getEntry();

    this.entryService.entry$.subscribe(currentEntry => {
      this.entryLocal = currentEntry;
    });
  }
}
