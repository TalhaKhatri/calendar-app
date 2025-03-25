import { Injectable } from '@angular/core';
import { CdkDragDrop, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { Appointment } from '../models/appointment.model';
import { DateService } from './date.service';
import { AppointmentService } from '../../calendar/services/appointment.service';

interface DragPosition {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  // Event streams for drag states
  private dragStartedSubject = new Subject<{ event: CdkDragStart, appointment: Appointment }>();
  private dragMovedSubject = new Subject<CdkDragMove<any>>();
  private dragEndedSubject = new Subject<void>();

  // Expose as observables
  readonly dragStarted$ = this.dragStartedSubject.asObservable();
  readonly dragMoved$ = this.dragMovedSubject.asObservable();
  readonly dragEnded$ = this.dragEndedSubject.asObservable();

  // State tracking for drag operations
  private dragStartY = 0;
  private initialAppointmentPosition = 0;
  private currentAppointment: Appointment | null = null;
  private dragStartPosition: DragPosition = { x: 0, y: 0 };
  private dragStartElement: HTMLElement | null = null;

  constructor(
    private dateService: DateService,
    private appointmentService: AppointmentService
  ) {}

  /**
   * Handle the start of a drag operation
   */
  onDragStarted(event: CdkDragStart, appointment: Appointment): void {
    // Get the dragging element and its initial position
    this.dragStartElement = event.source.element.nativeElement;
    const rect = this.dragStartElement.getBoundingClientRect();

    // Store initial position information
    this.dragStartPosition = {
      x: rect.left,
      y: rect.top
    };

    this.dragStartY = event.source.getFreeDragPosition().y;
    this.initialAppointmentPosition = this.dateService.calculateAppointmentPosition(appointment.startTime);
    this.currentAppointment = appointment;

    // Add a class to the source element to help with styling during drag
    this.dragStartElement.classList.add('dragging');

    // Add a class to the body to indicate dragging for styling purposes
    document.body.classList.add('appointment-dragging');

    // Apply styles to the preview immediately to prevent unwanted animations
    setTimeout(() => {
      const preview = document.querySelector('.cdk-drag-preview') as HTMLElement;
      if (preview) {
        preview.classList.add('no-transition');
        preview.style.transition = 'none';
        preview.style.transform = 'none';
      }
    }, 0);

    // Emit the dragStarted event
    this.dragStartedSubject.next({ event, appointment });
  }

  /**
   * Handle drag movement
   */
  onDragMoved(event: CdkDragMove<any>): void {
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

    // Emit the dragMoved event
    this.dragMovedSubject.next(event);
  }

  /**
   * Handle the drop event at the end of a drag operation
   */
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
      this.handleCrossDayDrop(appointment, event.container.data);
    }
    // Handle time change (vertical movement within same container)
    else if (event.container === event.previousContainer) {
      this.handleTimeDrop(appointment, event.distance.y);
    }

    // Reset drag tracking variables
    this.currentAppointment = null;
    this.dragStartPosition = { x: 0, y: 0 };

    // Emit the dragEnded event
    this.dragEndedSubject.next();
  }

  /**
   * Handle appointment being moved to a different day
   */
  private handleCrossDayDrop(appointment: Appointment, newDateValue: Date): void {
    const newDate = new Date(newDateValue);

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

  /**
   * Handle appointment time change (vertical movement)
   */
  private handleTimeDrop(appointment: Appointment, yOffset: number): void {
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
}
