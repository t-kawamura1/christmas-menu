import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UpdateMenuInput, WishMenuService } from '../menu.service';
import { WishMenu } from '../model/menu';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent implements OnChanges {
  private readonly menuService = inject(WishMenuService)
  private readonly destroyRef = inject(DestroyRef)

  @Input({ required: true })
  menu!: WishMenu;

  @Output()
  readonly edited = new EventEmitter<void>()
  @Output()
  readonly cancel = new EventEmitter<void>()

  readonly name = signal('')
  readonly recommendation = signal('')
  readonly createdBy = signal('')

  ngOnChanges(): void {
    this.name.set(this.menu.name)
    this.recommendation.set(this.menu.recommendation)
    this.createdBy.set(this.menu.createdBy)
  }

  onUpdate() {
    const input: UpdateMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
    }
    this.menuService.update(this.menu.id, input)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.edited.emit()
    })
  }
}
