import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'help-toggle',
  standalone: false,
  templateUrl: './help-toggle.html',
  styleUrl: './help-toggle.sass',
})
export class HelpToggle {
  @Input() key = '';
  @Input() isActive = false;
  @Output() toggle = new EventEmitter<string>();

  /**
   * Súgó ki-be kapcsolása.
   */
  onToggle(): void {
    this.toggle.emit(this.key);
  }

  /**
   * Enter megnyomásával is lehet aktiválni a súgót.
   * @param e - A lenyomott billentyű.
   */
  onKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Enter')
    {
      this.onToggle();
    }
  }
}
