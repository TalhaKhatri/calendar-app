import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Observer, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type CalendarViewType = 'month' | 'week' | 'day';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  private currentDateSubject = new BehaviorSubject<Date>(new Date());
  private viewTypeSubject = new BehaviorSubject<CalendarViewType>('month');

  // Expose as observables
  readonly currentDate$ = this.currentDateSubject.asObservable();
  readonly viewType$ = this.viewTypeSubject.asObservable();

  // Computed calendar days based on current date and view type
  readonly calendarDays$ = this.computeCalendarDays();

  readonly monthAndYear$ = this.computeMonthYearLabel();

  // Hour slots for week and day views
  readonly hourSlots: string[] = this.generateHourSlots();

  constructor() {}

  // Public methods to change state
  setDate(date: Date): void {
    this.currentDateSubject.next(date);
  }

  setViewType(viewType: CalendarViewType): void {
    this.viewTypeSubject.next(viewType);
  }

  next(): void {
    const currentDate = this.currentDateSubject.getValue();
    const viewType = this.viewTypeSubject.getValue();

    let newDate: Date;

    if (viewType === 'month') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    } else if (viewType === 'week') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
    } else { // day view
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    }

    this.currentDateSubject.next(newDate);
  }

  previous(): void {
    const currentDate = this.currentDateSubject.getValue();
    const viewType = this.viewTypeSubject.getValue();

    let newDate: Date;

    if (viewType === 'month') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    } else if (viewType === 'week') {
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
    } else { // day view
      newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
    }

    this.currentDateSubject.next(newDate);
  }

  today(): void {
    this.currentDateSubject.next(new Date());
  }

  // Helper methods
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isCurrentMonth(date: Date): boolean {
    const currentDate = this.currentDateSubject.getValue();
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  }

  // Time calculations for appointment positioning
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
      return position;
    } catch (e) {
      console.error('Error calculating appointment position', e);
      return 0;
    }
  }

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

  // Private implementation methods
  private generateHourSlots(): string[] {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
    }
    return slots;
  }

  private computeCalendarDays(): Observable<Date[]> {
    return combineLatest([this.currentDate$, this.viewType$]).pipe(
      map(([date, viewType]) => this.generateCalendarDays(date, viewType)),
      shareReplay(1) // Cache the latest value
    );
  }

  private generateCalendarDays(date: Date, viewType: CalendarViewType): Date[] {
    if (viewType === 'month') {
      return this.generateMonthView(date);
    } else if (viewType === 'week') {
      return this.generateWeekView(date);
    } else { // day view
      return [new Date(date)];
    }
  }

  private generateMonthView(date: Date): Date[] {
    const days: Date[] = [];

    // Get first day of month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    // Get last day of month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

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
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }

  private generateWeekView(date: Date): Date[] {
    const days: Date[] = [];

    // Get the first day of the week (Sunday)
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - date.getDay());

    // Generate all days of the week
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek);
      day.setDate(firstDayOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }

  private computeMonthYearLabel(): Observable<string> {
    return combineLatest([this.currentDate$, this.viewType$]).pipe(
      map(([date, viewType]) => this.formatMonthYear(date, viewType)),
      shareReplay(1) // Cache the latest value
    );
  }

  private formatMonthYear(date: Date, viewType: CalendarViewType): string {
    if (viewType === 'month') {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    } else if (viewType === 'week') {
      // We need to calculate the days for the week
      const days = this.generateWeekView(date);
      const firstDay = days[0];
      const lastDay = days[6];

      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(firstDay)} ${firstDay.getDate()} - ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
      } else {
        return `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(firstDay)} ${firstDay.getDate()} - ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(lastDay)} ${lastDay.getDate()}, ${firstDay.getFullYear()}`;
      }
    } else { // day view
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
    }
  }
}
