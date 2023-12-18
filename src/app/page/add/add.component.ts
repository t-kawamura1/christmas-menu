import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AddMenuInput, WishMenuService } from '../menu.service';
import { Families } from '../model/families';
import { FamilyService } from '../family.service';

export type MenuFormState = 'ADD' | 'EDIT' | 'DETAIL' | 'ADOPTED'

@Component({
  selector: 'app-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss'
})
export class AddComponent implements OnInit {
  private readonly menuService = inject(WishMenuService)
  private readonly familyService = inject(FamilyService)
  private readonly destroyRef = inject(DestroyRef)

  @Output()
  readonly added = new EventEmitter<void>()
  @Output()
  readonly cancel = new EventEmitter<void>()

  families: Families = []

  readonly name = signal('')
  readonly recommendation = signal('')
  readonly createdBy = signal(this.families[0])

  ngOnInit(): void {
    this.familyService.list()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((families) => {
      this.families = families
    })
  }

  onAdd() {
    const input: AddMenuInput = {
      name: this.name(),
      recommendation: this.recommendation(),
      createdBy: this.createdBy(),
    }
    this.menuService.add(input)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.added.emit()
    })
  }
}
