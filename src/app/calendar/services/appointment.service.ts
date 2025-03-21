import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Appointment } from '../../shared/models/appointment.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointments: Appointment[] = [];
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);

  constructor() {
    // Load from localStorage if exists
    const savedAppointments = localStorage.getItem('appointments');
    if (savedAppointments) {
      try {
        const parsed = JSON.parse(savedAppointments);
        this.appointments = parsed.map((app: any) => ({
          ...app,
          date: new Date(app.date)
        }));
        this.appointmentsSubject.next([...this.appointments]);
      } catch (e) {
        console.error('Error parsing appointments from localStorage', e);
      }
    }
  }

  // Get all appointments as Observable
  getAppointments(): Observable<Appointment[]> {
    return this.appointmentsSubject.asObservable();
  }

  // Get appointments for a specific date
  getAppointmentsByDate(date: Date): Observable<Appointment[]> {
    return this.appointmentsSubject.pipe(
      map(appointments => appointments.filter(app =>
        app.date.getFullYear() === date.getFullYear() &&
        app.date.getMonth() === date.getMonth() &&
        app.date.getDate() === date.getDate()
      ))
    );
  }

  // Add a new appointment
  addAppointment(appointment: Omit<Appointment, 'id'>): Observable<Appointment> {
    const newAppointment: Appointment = {
      ...appointment,
      id: this.generateId()
    };

    this.appointments.push(newAppointment);
    this.updateAppointments();
    return of(newAppointment);
  }

  // Update existing appointment
  updateAppointment(appointment: Appointment): Observable<Appointment> {
    const index = this.appointments.findIndex(app => app.id === appointment.id);
    if (index !== -1) {
      this.appointments[index] = { ...appointment };
      this.updateAppointments();
      return of(appointment);
    }
    return of(null as any);
  }

  // Delete appointment
  deleteAppointment(id: string): Observable<boolean> {
    const index = this.appointments.findIndex(app => app.id === id);
    if (index !== -1) {
      this.appointments.splice(index, 1);
      this.updateAppointments();
      return of(true);
    }
    return of(false);
  }

  // Update appointment date (for drag & drop)
  moveAppointment(id: string, newDate: Date): Observable<Appointment | null> {
    console.log(`Attempting to move appointment ${id} to ${newDate}`);
    const index = this.appointments.findIndex(app => app.id === id);

    if (index !== -1) {
      // Create a proper date object if it's not already
      const dateToUse = newDate instanceof Date ? newDate : new Date(newDate);

      const updatedAppointment = {
        ...this.appointments[index],
        date: dateToUse
      };

      console.log('Before update:', this.appointments[index]);
      this.appointments[index] = updatedAppointment;
      console.log('After update:', updatedAppointment);

      this.updateAppointments();
      return of(updatedAppointment);
    }

    console.log(`Appointment with id ${id} not found`);
    return of(null);
  }

  // Update appointment times (for vertical drag & drop)
  updateAppointmentTime(id: string, newStartTime: string, newEndTime: string): Observable<Appointment | null> {
    console.log(`Attempting to update appointment ${id} times to ${newStartTime} - ${newEndTime}`);
    const index = this.appointments.findIndex(app => app.id === id);

    if (index !== -1) {
      const updatedAppointment = {
        ...this.appointments[index],
        startTime: newStartTime,
        endTime: newEndTime
      };

      console.log('Before time update:', this.appointments[index]);
      this.appointments[index] = updatedAppointment;
      console.log('After time update:', updatedAppointment);

      this.updateAppointments();
      return of(updatedAppointment);
    }

    console.log(`Appointment with id ${id} not found`);
    return of(null);
  }

  // Save to localStorage and notify subscribers
  private updateAppointments(): void {
    this.appointmentsSubject.next([...this.appointments]);
    localStorage.setItem('appointments', JSON.stringify(this.appointments));
  }

  // Generate a simple ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
