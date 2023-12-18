import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditComponent } from './edit.component';
import { WishMenuService } from '../menu.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WishMenu } from '../model/menu';

export type EditDialogData = {
  id: number,
}

export type EditDialogResult = 'EDITED' | undefined

@Component({
  standalone: true,
  imports: [
    CommonModule,
    EditComponent,
  ],
  template: `
    <app-edit
      [menu]="menu"
      (cancel)="close(undefined)"
      (edited)="close('EDITED')"
    ></app-edit>
  `,
  styles: [`
    app-edit {
      display: block;
      padding: 24px;
      width: 400px
    }
  `]
})
export class EditDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<EditDialogComponent>)
  private readonly data: EditDialogData = inject(MAT_DIALOG_DATA)
  private readonly menuService = inject(WishMenuService)
  private readonly destroyRef = inject(DestroyRef)

  menu!: WishMenu

  ngOnInit(): void {
    this.menuService.get(this.data.id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((menu) => {
      this.menu = menu
    })
  }

  close(result: EditDialogResult) {
    this.dialogRef.close(result)
  }
}
