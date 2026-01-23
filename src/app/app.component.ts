import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';

import { SqliteService } from './services/database-movil/sqlite.service';
import { SyncService } from './services/sync.service';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, RouterModule],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private location: Location,
    private sqliteService: SqliteService,
    private syncService: SyncService,
    private network: NetworkService
  ) {}

  async ngOnInit() {
    try {
      await this.sqliteService.openDatabase();
    } catch (error: any) {
      console.error('[AppComponent] Error inicializando app:', { message: error?.message });
    }
  }
}
