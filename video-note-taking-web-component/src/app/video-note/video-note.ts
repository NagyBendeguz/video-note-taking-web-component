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
  arrayEntry$: Observable<Array<Entry>> = new Observable<Array<Entry>>();

  constructor(private entryService: EntryService) {}

  ngAfterViewInit(): void {
    this.arrayEntry$ = this.entryService.getArrayEntry();
  }
}
