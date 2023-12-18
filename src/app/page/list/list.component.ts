import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { WishMenuList } from '../model/menu';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTableModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnChanges {
  @Input({ required: true })
  list!: WishMenuList;

  @Output()
  readonly edit = new EventEmitter<number>()
  @Output()
  readonly delete = new EventEmitter<number>()
  @Output()
  readonly vote = new EventEmitter<number>()

  readonly displayedColumns = [
    'id',
    'name',
    'recommendation',
    'createdBy',
    'votes',
    'plus',
    'edit',
    'delete',
  ]

  ngOnChanges(): void {
    this.list = [{
      id: 0,
      name: 'ローストチキン',
      recommendation: 'メニュー例です', 
      createdBy: '父',
      numberOfVotes: 0,
    }].concat(this.list)
  }
}
