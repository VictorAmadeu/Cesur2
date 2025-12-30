import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  imports: [CommonModule]
})
export class LogoComponent implements OnInit {
  isDarkMode = false;

  ngOnInit() {
    this.isDarkMode = document.body.classList.contains('dark');
  }

}
