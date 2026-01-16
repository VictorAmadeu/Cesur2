import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './services/database-movil/sqlite.service';
import { Router, RouterModule } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Location } from '@angular/common';
import { SyncService } from './services/sync.service';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, RouterModule],
})
export class AppComponent implements OnInit {
  constructor(
    private platform: Platform,
    private location: Location,
    private router: Router,
    private sqliteService: SqliteService,
    private syncService: SyncService,
    private network: NetworkService
  ) {
  }

  async ngOnInit() {
    try {
      console.log('🧹 Eliminando base de datos previa...');
      //await this.sqliteService.deleteDatabase();

      console.log('🗄️ Creando nueva base de datos...');
      await this.sqliteService.openDatabase();

      console.log('🌐 Iniciando red y sincronización...');
      // await this.network.initNetworkListener();
      // await this.syncService.init();

      console.log('✅ App inicializada correctamente');
    } catch (error) {
      console.error('Error inicializando app:', error);
    }
}

}
