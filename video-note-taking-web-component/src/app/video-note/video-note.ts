import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';

@Component({
  selector: 'app-video-note',
  standalone: false,
  templateUrl: './video-note.html',
  styleUrl: './video-note.sass',
})
export class VideoNote {
  arrayEntry$!: Observable<Array<Entry>>;
  isExtendedViews: boolean[] = [];

  constructor(private entryService: EntryService) {}

  ngOnInit(): void {
    this.arrayEntry$ = this.entryService.getArrayEntry();
  }

  toggleView(idx: number) {
    this.isExtendedViews[idx] = !this.isExtendedViews[idx];
  }
}
