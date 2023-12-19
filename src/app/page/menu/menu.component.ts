import { Component, Input, WritableSignal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { WishMenuService } from '../menu.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  @Input({ required: true })
  id!: WritableSignal<number>

  private readonly menuService = inject(WishMenuService)
  
  readonly menu = computed(() => toSignal(this.menuService.get(this.id())))
}
