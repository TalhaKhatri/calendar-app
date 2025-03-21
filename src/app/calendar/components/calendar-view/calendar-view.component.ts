import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type CalendarViewType = 'month' | 'week' | 'day';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit {
  currentDate = new Date();
  calendarDays: Date[] = [];
  appointments$: Observable<Appointment[]>;
  weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // View type and time slots
  currentView: CalendarViewType = 'month';
  hourSlots: string[] = [];

  constructor(private appointmentService: AppointmentService) {
    this.appointments$ = this.appointmentService.getAppointments();
    this.generateHourSlots();
  }

  ngOnInit(): void {
    this.generateCalendarDays();
  }

  generateHourSlots(): void {
    this.hourSlots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      this.hourSlots.push(`${hour}:00`);
    }
  }

  generateCalendarDays(): void {
    this.calendarDays = [];

    if (this.currentView === 'month') {
      this.generateMonthView();
    } else if (this.currentView === 'week') {
      this.generateWeekView();
    } else if (this.currentView === 'day') {
      this.generateDayView();
    }
  }

  generateMonthView(): void {
    // Get first day of month
    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);

    // Get last day of month
    const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

    // Get first day of the calendar (might be from the previous month)
    const firstCalendarDay = new Date(firstDay);
    firstCalendarDay.setDate(firstCalendarDay.getDate() - firstCalendarDay.getDay());

    // Get last day of the calendar (might be from the next month)
    const lastCalendarDay = new Date(lastDay);
    const remainingDays = 6 - lastCalendarDay.getDay();
    lastCalendarDay.setDate(lastCalendarDay.getDate() + remainingDays);

    // Generate all days
    let currentDay = new Date(firstCalendarDay);
    while (currentDay <= lastCalendarDay) {
      this.calendarDays.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
  }

  generateWeekView(): void {
    // Get the first day of the week (Sunday)
    const firstDayOfWeek = new Date(this.currentDate);
    firstDayOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

    // Generate all days of the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      this.calendarDays.push(day);
    }
  }

  generateDayView(): void {
    // Just the current day
    this.calendarDays = [new Date(this.currentDate)];
  }

  next(): void {
    if (this.currentView === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else if (this.currentView === 'week') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 7);
    } else if (this.currentView === 'day') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() + 1);
    }
    this.generateCalendarDays();
  }

  previous(): void {
    if (this.currentView === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else if (this.currentView === 'week') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() - 7);
    } else if (this.currentView === 'day') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), this.currentDate.getDate() - 1);
    }
    this.generateCalendarDays();
  }

  today(): void {
    this.currentDate = new Date();
    this.generateCalendarDays();
  }

  changeView(viewType: CalendarViewType): void {
    this.currentView = viewType;
    this.generateCalendarDays();
  }

  getMonthAndYear(): string {
    if (this.currentView === 'month') {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.currentDate);
    } else if (this.currentView === 'week') {
      const firstDay = this.calendarDays[0];
      const lastDay = this.calendarDays[6];

      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(firstDay)} ${firstDay.getDate()} - ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
      } else {
        return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(firstDay)} ${firstDay.getDate()} - ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(lastDay)} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
      }
    } else {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(this.currentDate);
    }
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentDate.getMonth();
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  getAppointmentsForDate(date: Date): Observable<Appointment[]> {
    return this.appointments$.pipe(
      map(appointments => appointments.filter(app =>
        app.date.getFullYear() === date.getFullYear() &&
        app.date.getMonth() === date.getMonth() &&
        app.date.getDate() === date.getDate()
      ))
    );
  }

  /**
   * Calculate the top position for an appointment based on its start time
   * @param startTime Time string in HH:MM format
   * @returns CSS top position in pixels
   */
  calculateAppointmentPosition(startTime: string): number {
    try {
      const [hoursStr, minutesStr] = startTime.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      if (isNaN(hours) || isNaN(minutes)) {
        console.log('Invalid time format:', startTime);
        return 0;
      }

      // Position should be hours * 60px (for each hour slot) + the minutes percentage of 60px
      const position = (hours * 60) + ((minutes / 60) * 60);
      console.log(`Position for ${startTime}: ${position}px (${hours} hours, ${minutes} minutes)`);
      return position;
    } catch (e) {
      console.error('Error calculating appointment position', e);
      return 0;
    }
  }

  /**
   * Calculate the appointment height based on start and end time
   * @param startTime Time string in HH:MM format
   * @param endTime Time string in HH:MM format
   * @returns CSS height in pixels
   */
  calculateAppointmentHeight(startTime: string, endTime: string): number {
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
        return 60; // Default to 1 hour height
      }

      // Calculate total minutes
      const startTotalMinutes = (startHours * 60) + startMinutes;
      const endTotalMinutes = (endHours * 60) + endMinutes;

      // Calculate difference in minutes, with minimum height of 30px
      const heightInMinutes = Math.max(30, endTotalMinutes - startTotalMinutes);

      // Convert to pixels (1 minute = 1px)
      return heightInMinutes;
    } catch (e) {
      console.error('Error calculating appointment height', e);
      return 60; // Default to 1 hour height
    }
  }

  onDrop(event: CdkDragDrop<Date>): void {
    if (event.container.data && event.previousContainer !== event.container) {
      const appointment = event.item.data as Appointment;

      if (appointment) {
        const newDate = new Date(event.container.data);

        // Create a new Date that preserves the original time but changes the date
        const updatedDate = new Date(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
          new Date(appointment.date).getHours(),
          new Date(appointment.date).getMinutes()
        );

        console.log(`Moving appointment from ${appointment.date} to ${updatedDate}`);

        this.appointmentService.moveAppointment(appointment.id, updatedDate).subscribe(
          result => {
            if (result) {
              console.log('Appointment moved successfully');
            } else {
              console.error('Failed to move appointment');
            }
          },
          error => console.error('Error moving appointment', error)
        );
      }
    }
  }
}
