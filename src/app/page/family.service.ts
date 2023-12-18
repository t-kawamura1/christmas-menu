import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Families } from './model/families';

@Injectable({
  providedIn: 'root'
})
export class FamilyService {
  list(): Observable<Families> {
    return of(Families)
  }
}
