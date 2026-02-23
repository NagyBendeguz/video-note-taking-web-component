import { Component, Input } from '@angular/core';
import { Entry } from '../models/entry';

@Component({
  selector: 'app-extended-view',
  standalone: false,
  templateUrl: './extended-view.html',
  styleUrl: './extended-view.sass',
})
export class ExtendedView {
  @Input() entry: Entry = new Entry();
  @Input() isExtendedView: boolean = false;

  editEntry(): void {
    
  }

  deleteEntry(): void {

  }

  closeExtendedView(): void {
    this.isExtendedView = !this.isExtendedView;
  }
}
