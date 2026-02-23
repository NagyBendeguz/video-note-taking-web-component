import { Component, Input } from '@angular/core';
import { Entry } from '../models/entry';

@Component({
  selector: 'app-compressed-view',
  standalone: false,
  templateUrl: './compressed-view.html',
  styleUrl: './compressed-view.sass',
})
export class CompressedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView: boolean = false;

  openExtendedView(): void {
    this.isExtendedView = !this.isExtendedView;
  }
}
