import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Entry } from '../models/entry';
import { EntryService } from '../services/entry';
import { marked } from 'marked';

@Component({
  selector: 'app-video-note',
  standalone: false,
  templateUrl: './video-note.html',
  styleUrl: './video-note.sass',
})
export class VideoNote {
  arrayEntry$!: Observable<Array<Entry>>;
  isExtendedViews: Map<string, boolean> = new Map();

  constructor(private entryService: EntryService) {}

  ngOnInit(): void {
    this.arrayEntry$ = this.entryService.getArrayEntry();

    this.arrayEntry$.subscribe(entries => {
      entries.forEach(entry => {
        this.formatNote(entry);
      });
    });
  }

  toggleView(entryId: string): void {
    const currentState = this.isExtendedViews.get(entryId) || false;
    this.isExtendedViews.set(entryId, !currentState);
  }

  async formatNote(entry: Entry): Promise<void> {
    entry.formattedNoteHTML = await marked(entry.formattedNoteHTML);
  }
}
