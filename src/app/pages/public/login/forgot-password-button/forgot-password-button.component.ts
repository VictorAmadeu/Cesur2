import { Component, Input, OnInit } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  selector: 'app-forgot-password-button',
  templateUrl: './forgot-password-button.component.html',
  styleUrls: ['./forgot-password-button.component.scss'],
  imports: [IonButton]
})
export class ForgotPasswordButtonComponent implements OnInit {
  @Input() email: string = '';

  constructor(private toastService: ToastService) { }

  ngOnInit() { }


  onForgotPassword() {
    this.toastService.show(`Enviando email de recuperación a: ${this.email}`);
  }
}
