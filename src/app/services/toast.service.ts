import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
    providedIn: 'root',
})
export class ToastService {

    constructor(private toastController: ToastController) { }

    async show(message: string = "", color: string = 'primary', duration = 2000, positionAnchor = 'header') {
        const toast = await this.toastController.create({
            message,
            duration,
            position: 'top',
            color,
            positionAnchor,
            cssClass: 'custom-toast'
        });
        toast.present();
    }
}