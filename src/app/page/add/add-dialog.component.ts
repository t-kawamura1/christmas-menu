import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AddComponent } from './add.component';

export type AddDialogResult = 'ADDED' | undefined

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AddComponent,
  ],
  template: `
    <app-add
      (cancel)="close(undefined)"
      (added)="close('ADDED')"
    ></app-add>
  `,
  styles: [`
    app-add {
      display: block;
      padding: 24px;
      width: 400px
    }
  `]
})
export class AddDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddDialogComponent>)

  close(result: AddDialogResult) {
    this.dialogRef.close(result)
  }
}
