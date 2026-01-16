import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private _isOnline = new BehaviorSubject<boolean>(true);
  public isOnline$ = this._isOnline.asObservable();

  constructor() {
    this.initNetworkListener();
  }

  async initNetworkListener() {
    const status = await Network.getStatus();
    this._isOnline.next(status.connected);

    Network.addListener('networkStatusChange', (status) => {
      console.log('[NETWORK] Estado de conexión:', status.connected ? 'ONLINE' : 'OFFLINE');
      this._isOnline.next(status.connected);
    });
  }

  get isOnline(): boolean {
    return this._isOnline.value;
  }
}
