import { Component, Input, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment.model';

@Component({
  selector: 'app-calendar-day',
  templateUrl: './calendar-day.component.html',
  styleUrls: ['./calendar-day.component.scss']
})
export class CalendarDayComponent implements OnInit {
  @Input() date: Date = new Date();
  @Input() appointments: Appointment[] = [];
  @Input() isToday = false;
  @Input() isCurrentMonth = true;

  constructor() { }

  ngOnInit(): void {
  }

  get dayNumber(): number {
    return this.date.getDate();
  }
}
