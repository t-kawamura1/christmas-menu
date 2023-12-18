import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of } from 'rxjs';
import { WishMenu, WishMenuList } from './model/menu';

export type AddMenuInput = Readonly<{
  name: string,
  recommendation: string,
  createdBy: string
}>

export type UpdateMenuInput = Readonly<Omit<AddMenuInput, 'createdBy'>>

@Injectable({
  providedIn: 'root'
})
export class WishMenuService {
  private readonly store = new BehaviorSubject<WishMenuList>([])

  add(input: AddMenuInput): Observable<void> {
    const lastMenu = this.store.value.slice(-1)[0]
    this.store.next([
      ...this.store.value,
      {
        ...input,
        id: lastMenu === undefined ? 1 : lastMenu.id + 1,
        numberOfVotes: 0,
      }
    ])
    return of(undefined)
  }

  update(id: number, input: UpdateMenuInput): Observable<void> {
    this.store.next(
      this.store.value.map(menu => menu.id === id
        ? {
            ...menu,
            name: input.name,
            recommendation: input.recommendation,
          }
        : menu
      )
    )
    return of(undefined)
  }

  delete(id: number): Observable<void> {
    this.store.next(
      this.store.value.filter(menu => menu.id !== id)
    )
    return of(undefined)
  }

  vote(id: number): Observable<void> {
    this.store.next(
      this.store.value.map(menu => menu.id === id
        ? {
            ...menu,
            numberOfVotes: menu.numberOfVotes + 1,
          }
        : menu
      )
    )
    return of(undefined)
  }

  get(id: number): Observable<WishMenu> {
    return this.store.pipe(
      map(menus => menus.find(menu => menu.id === id)!)
    )
  }

  list(): Observable<WishMenuList> {
    return this.store.asObservable()
  }
}
