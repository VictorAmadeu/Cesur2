import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonButton, IonRouterOutlet } from "@ionic/angular/standalone";
import { AuthService } from 'src/app/services/auth.service';
import { Location } from '@angular/common';
import { NavigationService } from 'src/app/services/navigation.service';
import { RouteHeaderService } from 'src/app/services/route-header.service';


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
  date: string = '29/08/2024';
  logoutButton: boolean = true;

  constructor(
    private router: Router,
    private headerService: RouteHeaderService,
    private navigationService: NavigationService,
  ) {
    this.headerService.header$.subscribe(info => {
        this.currentRouteName = info.title;
        this.currentSubtitle = info.subtitle;
        this.currentSubtitleTwo = info.subtitleTwo;
      });

    this.navigationService.currentRoute$.subscribe(route => {
      if (route === '/privado/rutas') {
        this.logoutButton = true;
      } else {
        this.logoutButton = false;
      }
    });
  }

  ngOnInit() { }

  onClick(tab: string) {
    this.router.navigate([`/privado/${tab}`]);
  }

  async turnBack() {
    await this.navigationService.goBack();
  }
}
