import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  imports: [CommonModule, IonSpinner]
})
export class LoadingComponent implements OnInit {

  ngOnInit() {}

}
