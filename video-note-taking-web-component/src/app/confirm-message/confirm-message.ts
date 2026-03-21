import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-message',
  standalone: false,
  templateUrl: './confirm-message.html',
  styleUrl: './confirm-message.sass',
})
export class ConfirmMessage {
  @Input() message!: string;
  @Input() type!: string;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  confirmButton() {
    this.confirm.emit();
  }

  cancelButton() {
    this.cancel.emit();
  }
}
