import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonButton, IonRouterOutlet } from "@ionic/angular/standalone";
import { AuthService } from 'src/app/services/auth.service';
import { Location } from '@angular/common';
import { NavigationService } from 'src/app/services/navigation.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';
import { DateService } from 'src/app/services/dale.service';

@Component({
  selector: 'app-private-layout',
  templateUrl: './private-layout.component.html',
  styleUrls: ['./private-layout.component.scss'],
  imports: [RouterModule, IonButton, IonRouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PrivateLayoutComponent implements OnInit {
  currentRouteName?: string;
  currentSubtitle?: string;
  currentSubtitleTwo?: string;

  // Línea adicional opcional para mostrar progreso (ej: "2 de 43 entregas" = 2/43)
  currentSubtitleProgress?: string;

  // Evitamos fecha fija: se inicializa desde el servicio
  date: string = '';
  logoutButton: boolean = true;

  constructor(
    private router: Router,
    private headerService: RouteHeaderService,
    private navigationService: NavigationService,
    private dateService: DateService,
  ) {
    this.headerService.header$.subscribe(info => {
      this.currentRouteName = info.title;
      this.currentSubtitle = info.subtitle;
      this.currentSubtitleTwo = info.subtitleTwo;
      this.currentSubtitleProgress = info.subtitleProgress;
    });

    this.navigationService.currentRoute$.subscribe(route => {
      if (route === '/privado/rutas') {
        this.logoutButton = true;
      } else {
        this.logoutButton = false;
      }
    });
  }

  ngOnInit() {
    // Carga la fecha actual/seleccionada para evitar hardcode en UI
    this.date = this.dateService.getDate();
  }

  onClick(tab: string) {
    this.router.navigate([`/privado/${tab}`]);
  }

  async turnBack() {
    await this.navigationService.goBack();
  }
}
