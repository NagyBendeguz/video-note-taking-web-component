import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-help-toggle',
  standalone: false,
  templateUrl: './help-toggle.html',
  styleUrl: './help-toggle.sass',
})
export class HelpToggle {
  @Input() key = '';
  @Input() isActive = false;
  @Output() toggle = new EventEmitter<string>();

  onToggle(): void {
    this.toggle.emit(this.key);
  }

  onKeyDown(e: KeyboardEvent): void
  {
    if (e.key === 'Enter')
    {
      this.onToggle();
    }
  }
}
