import { Component, OnInit } from '@angular/core';
import { IonContent, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
  imports: [IonContent, IonIcon, IonButton, IonButtons],
})
export class ErrorComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit() { }

  goToHome() {
    this.router.navigate(['/public/login']);
  }
}
