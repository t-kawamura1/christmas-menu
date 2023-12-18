import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { ListComponent } from './list/list.component';
import { WishMenuService } from './menu.service';
import { WishMenuList } from './model/menu';
import { Subject, takeUntil } from 'rxjs';
import { AddDialogComponent, AddDialogResult } from './add/add-dialog.component';
import { EditDialogComponent, EditDialogData, EditDialogResult } from './edit/edit-dialog.component';

@Component({
  selector: 'app-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ListComponent,
  ],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss'
})
export class PageComponent implements OnInit, OnDestroy {
  private readonly wishMenuService = inject(WishMenuService)
  private readonly dialog = inject(MatDialog)

  list: WishMenuList = []

  private readonly onDestroy = new Subject<void>()

  ngOnInit(): void {
    this.getMenuList()
  }

  ngOnDestroy(): void {
    this.onDestroy.next()
  }

  private getMenuList() {
    this.wishMenuService.list()
    .pipe(takeUntil(this.onDestroy))
    .subscribe(list => this.list = list)
  }

  openAddDialog() {
    this.dialog.open(AddDialogComponent)
    .afterClosed()
    .pipe(takeUntil(this.onDestroy))
    .subscribe((result: AddDialogResult) => {
      if (result === 'ADDED') {
        console.log('登録成功')
      }
    })
  }

  vote(id: number) {
    this.wishMenuService.vote(id)
    .pipe(takeUntil(this.onDestroy))
    .subscribe(() => console.log('投票成功'))
  }

  openEditDialog(id: number) {
    const data: EditDialogData = { id }
    this.dialog.open(EditDialogComponent, { data })
    .afterClosed()
    .pipe(takeUntil(this.onDestroy))
    .subscribe((result: EditDialogResult) => {
      if (result === 'EDITED') {
        console.log('編集成功')
      }
    })
  }

  delete(id: number) {
    this.wishMenuService.delete(id)
    .pipe(takeUntil(this.onDestroy))
    .subscribe(() => console.log('削除成功'))
  }
}
