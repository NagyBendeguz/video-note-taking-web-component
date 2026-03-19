import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete',
  standalone: false,
  templateUrl: './confirm-delete.html',
  styleUrl: './confirm-delete.sass',
})
export class ConfirmDelete {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  confirmDelete() {
    this.confirm.emit();
  }

  cancelDelete() {
    this.cancel.emit();
  }
}
