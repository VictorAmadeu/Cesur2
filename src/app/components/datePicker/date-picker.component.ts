import { Component, ViewChild, OnInit } from '@angular/core';
import { IonModal, IonButton, IonIcon, IonDatetimeButton, IonDatetime } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { DateService } from 'src/app/services/dale.service';

@Component({
  selector: 'app-date-picker',
  templateUrl: 'date-picker.component.html',
  styleUrls: ['date-picker.component.scss'],
  imports: [FormsModule, IonDatetime, IonModal, IonButton, IonDatetimeButton, IonIcon],
})
export class DatePickerComponent implements OnInit {
  selectedDate!: string;
  @ViewChild(IonDatetime) datetime!: IonDatetime;
  @ViewChild(IonModal) modal!: IonModal;

  constructor(private dateService: DateService) {}

  ngOnInit() {
    this.selectedDate = this.dateService.getDate();
    this.dateService.selectedDate$.subscribe(date => {
      this.selectedDate = date;
      if (this.datetime) {
        this.datetime.value = this.selectedDate;
      }
    });
  }

  onDateChange(event: any) {
    this.dateService.setDate(event.detail.value);
    this.modal.dismiss();
  }

  previousDay() {
    this.dateService.previousDay();
  }

  nextDay() {
    this.dateService.nextDay();
  }
}
