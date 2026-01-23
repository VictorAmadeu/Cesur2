import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private _isOnline = new BehaviorSubject<boolean>(true);
  public isOnline$ = this._isOnline.asObservable();

  constructor() {
    this.initNetworkListener();
  }

  async initNetworkListener() {
    try {
      const status = await Network.getStatus();
      this._isOnline.next(status.connected);

      Network.addListener('networkStatusChange', statusChange => {
        this._isOnline.next(statusChange.connected);
      });
    } catch (_err) {
      console.error('[NetworkService] Error inicializando listener de red.');
    }
  }

  get isOnline(): boolean {
    return this._isOnline.value;
  }
}
