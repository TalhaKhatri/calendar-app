import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Appointment } from '../../shared/models/appointment.model';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface AppointmentOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  // Private subject for appointments state
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);

  // Expose as an observable
  readonly appointments$ = this.appointmentsSubject.asObservable();

  constructor() {
    this.loadAppointmentsFromStorage();
  }

  /**
   * Load appointments from localStorage
   */
  private loadAppointmentsFromStorage(): void {
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      try {
        const parsed = JSON.parse(savedAppointments);
        const appointments = parsed.map((app: any) => ({
          ...app,
          date: new Date(app.date)
        }));
        this.appointmentsSubject.next(appointments);
      } catch (e) {
        console.error('Error parsing appointments from localStorage', e);
        // Initialize with empty array if parsing fails
        this.appointmentsSubject.next([]);
      }
    }
  }

  /**
   * Get all appointments
   */
  getAppointments(): Observable<Appointment[]> {
    return this.appointments$;
  }

  /**
   * Get appointments for a specific date
   */
  getAppointmentsByDate(date: Date): Observable<Appointment[]> {
    return this.appointments$.pipe(
      map(appointments => appointments.filter(app => this.isSameDay(app.date, date)))
    );
  }

  /**
   * Get appointments for a specific day of week (across weeks)
   */
  getAppointmentsByDayOfWeek(dayOfWeek: number): Observable<Appointment[]> {
    return this.appointments$.pipe(
      map(appointments => appointments.filter(app => app.date.getDay() === dayOfWeek))
    );
  }

  /**
   * Add a new appointment
   */
  addAppointment(appointment: Omit<Appointment, 'id'>): Observable<AppointmentOperationResult<Appointment>> {
    return of(appointment).pipe(
      map(app => {
        const newAppointment: Appointment = {
          ...app,
          id: this.generateId()
        };

        // Get current state
        const currentAppointments = this.appointmentsSubject.getValue();

        // Update state with new appointment
        this.appointmentsSubject.next([...currentAppointments, newAppointment]);

        // Save to localStorage
        this.saveAppointmentsToStorage();

        return { success: true, data: newAppointment };
      }),
      catchError(error => of({
        success: false,
        error: `Failed to add appointment: ${error.message || 'Unknown error'}`
      }))
    );
  }

  /**
   * Update an existing appointment
   */
  updateAppointment(appointment: Appointment): Observable<AppointmentOperationResult<Appointment>> {
    return of(appointment).pipe(
      switchMap(app => {
        const currentAppointments = this.appointmentsSubject.getValue();
        const index = currentAppointments.findIndex(a => a.id === app.id);

        if (index === -1) {
          return of({
            success: false,
            error: `Appointment with id ${app.id} not found`
          });
        }

        // Create new array with updated appointment
        const updatedAppointments = [
          ...currentAppointments.slice(0, index),
          { ...app },
          ...currentAppointments.slice(index + 1)
        ];

        // Update state
        this.appointmentsSubject.next(updatedAppointments);

        // Save to localStorage
        this.saveAppointmentsToStorage();

        return of({ success: true, data: app });
      }),
      catchError(error => of({
        success: false,
        error: `Failed to update appointment: ${error.message || 'Unknown error'}`
      }))
    );
  }

  /**
   * Delete an appointment
   */
  deleteAppointment(id: string): Observable<AppointmentOperationResult<void>> {
    return of(id).pipe(
      switchMap(appointmentId => {
        const currentAppointments = this.appointmentsSubject.getValue();
        const index = currentAppointments.findIndex(app => app.id === appointmentId);

        if (index === -1) {
          return of({
            success: false,
            error: `Appointment with id ${appointmentId} not found`
          });
        }

        // Create new array without the deleted appointment
        const updatedAppointments = [
          ...currentAppointments.slice(0, index),
          ...currentAppointments.slice(index + 1)
        ];

        // Update state
        this.appointmentsSubject.next(updatedAppointments);

        // Save to localStorage
        this.saveAppointmentsToStorage();

        return of({ success: true });
      }),
      catchError(error => of({
        success: false,
        error: `Failed to delete appointment: ${error.message || 'Unknown error'}`
      }))
    );
  }

  /**
   * Move appointment to a different date (for drag & drop)
   */
  moveAppointment(id: string, newDate: Date): Observable<Appointment | null> {
    return of({ id, newDate }).pipe(
      switchMap(params => {
        const currentAppointments = this.appointmentsSubject.getValue();
        const index = currentAppointments.findIndex(app => app.id === params.id);

        if (index === -1) {
          console.log(`Appointment with id ${params.id} not found`);
          return of(null);
        }

        // Create a proper date object if it's not already
        const dateToUse = params.newDate instanceof Date ? params.newDate : new Date(params.newDate);

        const updatedAppointment = {
          ...currentAppointments[index],
          date: dateToUse
        };

        // Create new array with updated appointment
        const updatedAppointments = [
          ...currentAppointments.slice(0, index),
          updatedAppointment,
          ...currentAppointments.slice(index + 1)
        ];

        // Update state
        this.appointmentsSubject.next(updatedAppointments);

        // Save to localStorage
        this.saveAppointmentsToStorage();

        return of(updatedAppointment);
      }),
      catchError(error => {
        console.error('Error moving appointment:', error);
        return of(null);
      })
    );
  }

  /**
   * Save appointments to localStorage
   */
  private saveAppointmentsToStorage(): void {
    try {
      const appointments = this.appointmentsSubject.getValue();
      localStorage.setItem('appointments', JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error);
    }
  }

  /**
   * Check if two dates represent the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
