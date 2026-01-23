import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RefreshService {
  private refreshSubject = new Subject<string>();
  refresh$ = this.refreshSubject.asObservable();

  triggerRefresh(route: string) {
    this.refreshSubject.next(route);
  }
}
