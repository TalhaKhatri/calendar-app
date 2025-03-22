import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { CdkDragDrop, CdkDragMove, CdkDragStart, Point } from '@angular/cdk/drag-drop';
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

  // Variables to track drag information
  private dragStartY = 0;
  private initialAppointmentPosition = 0;
  private currentAppointment: Appointment | null = null;
  private dragStartPosition: { x: number, y: number } = { x: 0, y: 0 };
  private dragStartElement: HTMLElement | null = null;

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

  /**
   * Store the initial position when drag starts
   */
  dragStarted(event: CdkDragStart, appointment: Appointment): void {
    // Get the dragging element and its initial position
    this.dragStartElement = event.source.element.nativeElement;
    const rect = this.dragStartElement.getBoundingClientRect();

    // Store initial position information
    this.dragStartPosition = {
      x: rect.left,
      y: rect.top
    };

    this.dragStartY = event.source.getFreeDragPosition().y;
    this.initialAppointmentPosition = this.calculateAppointmentPosition(appointment.startTime);
    this.currentAppointment = appointment;

    // Add a class to the source element to help with styling during drag
    event.source.element.nativeElement.classList.add('dragging');

    // Add a class to the body to indicate dragging for styling purposes
    document.body.classList.add('appointment-dragging');

    // Attempt to disable any transitions that might cause floating
    setTimeout(() => {
      const preview = document.querySelector('.cdk-drag-preview') as HTMLElement;
      if (preview) {
        preview.classList.add('no-transition');
        preview.style.transition = 'none';
        preview.style.transform = 'none';
      }
    }, 0);
  }

  /**
   * Constraint function to snap appointment to half-hour intervals
   * This function keeps the vertical position aligned with time slots
   */
  constrainPosition = (point: Point, dragRef: any): Point => {
    if (!this.currentAppointment) {
      return point;
    }

    // Allow horizontal movement freely for cross-container dragging
    // We don't constrain X to allow moving between days

    // For vertical movement, snap to half-hour intervals
    const yOffset = point.y - this.dragStartY;
    const halfHourPixels = 30; // 30px represents 30 minutes
    const snappedYOffset = Math.round(yOffset / halfHourPixels) * halfHourPixels;

    // Calculate the new constrained Y position
    const newY = snappedYOffset;

    return { x: point.x, y: newY };
  }

  onDrop(event: CdkDragDrop<Date>): void {
    // Remove the drag classes
    document.body.classList.remove('appointment-dragging');
    if (this.dragStartElement) {
      this.dragStartElement.classList.remove('dragging');
      this.dragStartElement = null;
    }

    const appointment = event.item.data as Appointment;

    if (!appointment) {
      return;
    }

    // Handle cross-container drops (day to day movement)
    if (event.container.data && event.previousContainer !== event.container) {
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
    // Handle time change (vertical movement within same container)
    else if (event.container === event.previousContainer) {
      // Get the vertical displacement
      const yOffset = event.distance.y;

      if (Math.abs(yOffset) < 15) {
        return; // Ignore very small movements
      }

      // Calculate the time change in half-hour increments
      const halfHourPixels = 30; // 30px represents 30 minutes
      const halfHourIncrements = Math.round(yOffset / halfHourPixels);

      if (halfHourIncrements === 0) {
        return; // No significant movement to trigger a time change
      }

      // Get the current start and end times
      const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
      const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);

      // Calculate new times in minutes, adding the half-hour increments
      let newStartTotalMinutes = (startHours * 60 + startMinutes) + (halfHourIncrements * 30);
      let newEndTotalMinutes = (endHours * 60 + endMinutes) + (halfHourIncrements * 30);

      // Ensure times don't go below 0 or above 24 hours
      if (newStartTotalMinutes < 0) {
        const offset = newStartTotalMinutes;
        newStartTotalMinutes = 0;
        newEndTotalMinutes -= offset; // Keep the duration the same
      }

      if (newEndTotalMinutes > 24 * 60) {
        const excess = newEndTotalMinutes - (24 * 60);
        newEndTotalMinutes = 24 * 60;
        newStartTotalMinutes = Math.max(0, newStartTotalMinutes - excess); // Keep the duration the same
      }

      // Convert back to hours and minutes
      const newStartHours = Math.floor(newStartTotalMinutes / 60);
      const newStartMinutes = newStartTotalMinutes % 60;
      const newEndHours = Math.floor(newEndTotalMinutes / 60);
      const newEndMinutes = newEndTotalMinutes % 60;

      // Format the new times
      const newStartTime = `${newStartHours.toString().padStart(2, '0')}:${newStartMinutes.toString().padStart(2, '0')}`;
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${newEndMinutes.toString().padStart(2, '0')}`;

      console.log(`Changing appointment time from ${appointment.startTime}-${appointment.endTime} to ${newStartTime}-${newEndTime}`);

      // Clone the appointment and update the times
      const updatedAppointment: Appointment = {
        ...appointment,
        startTime: newStartTime,
        endTime: newEndTime
      };

      // Update the appointment
      this.appointmentService.updateAppointment(updatedAppointment).subscribe(
        result => {
          if (result) {
            console.log('Appointment time updated successfully');
          } else {
            console.error('Failed to update appointment time');
          }
        },
        error => console.error('Error updating appointment time', error)
      );
    }

    // Reset drag tracking variables
    this.currentAppointment = null;
    this.dragStartPosition = { x: 0, y: 0 };
  }

  /**
   * Handle drag movement
   */
  dragMoved(event: CdkDragMove<any>): void {
    // Get preview element (if available)
    const preview = document.querySelector('.cdk-drag-preview') as HTMLElement;
    if (preview) {
      // Add a custom class to help with styling
      preview.classList.add('dragging-appointment');

      // Apply immediate positioning to prevent float animation
      preview.style.transition = 'none';

      // Ensure the preview maintains the correct appearance
      preview.style.opacity = '0.9';
      preview.style.boxShadow = '0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)';
    }
  }
}
