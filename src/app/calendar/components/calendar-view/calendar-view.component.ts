import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from '../../../shared/models/appointment.model';
import { CdkDragDrop, CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { DateService, CalendarViewType } from '../../../shared/services/date.service';
import { DragDropService } from '../../../shared/services/drag-drop.service';

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit, OnDestroy {
  // RxJS streams from services
  currentDate$: Observable<Date>;
  calendarDays$: Observable<Date[]>;
  appointments$: Observable<Appointment[]>;
  monthAndYear$: Observable<string>;
  currentView$: Observable<CalendarViewType>;

  // Cached arrays for template
  calendarDays: Date[] = [];
  weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  hourSlots: string[] = [];

  // View type shortcut for template
  currentView: CalendarViewType = 'month';

  // Cleanup when component is destroyed
  private destroy$ = new Subject<void>();

  constructor(
    private appointmentService: AppointmentService,
    private dateService: DateService,
    private dragDropService: DragDropService
  ) {
    // Initialize streams from services
    this.currentDate$ = this.dateService.currentDate$;
    this.calendarDays$ = this.dateService.calendarDays$;
    this.appointments$ = this.appointmentService.appointments$;
    this.monthAndYear$ = this.dateService.monthAndYear$;
    this.currentView$ = this.dateService.viewType$;

    // Get hour slots from date service
    this.hourSlots = this.dateService.hourSlots;
  }

  ngOnInit(): void {
    // Subscribe to calendar days changes
    this.calendarDays$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(days => {
      this.calendarDays = days;
    });

    // Subscribe to view type changes
    this.currentView$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(viewType => {
      this.currentView = viewType;
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation methods delegate to date service
  next(): void {
    this.dateService.next();
  }

  previous(): void {
    this.dateService.previous();
  }

  today(): void {
    this.dateService.today();
  }

  changeView(viewType: CalendarViewType): void {
    this.dateService.setViewType(viewType);
  }

  // Date helper methods delegate to date service
  isCurrentMonth(date: Date): boolean {
    return this.dateService.isCurrentMonth(date);
  }

  isToday(date: Date): boolean {
    return this.dateService.isToday(date);
  }

  // Position calculation methods delegate to date service
  calculateAppointmentPosition(startTime: string): number {
    return this.dateService.calculateAppointmentPosition(startTime);
  }

  calculateAppointmentHeight(startTime: string, endTime: string): number {
    return this.dateService.calculateAppointmentHeight(startTime, endTime);
  }

  // Filtering appointments for a specific date
  getAppointmentsForDate(date: Date): Observable<Appointment[]> {
    return this.appointmentService.getAppointmentsByDate(date);
  }

  // Drag and drop event handlers delegate to drag drop service
  dragStarted(event: CdkDragStart, appointment: Appointment): void {
    this.dragDropService.onDragStarted(event, appointment);
  }

  dragMoved(event: CdkDragMove<any>): void {
    this.dragDropService.onDragMoved(event);
  }

  onDrop(event: CdkDragDrop<Date>): void {
    this.dragDropService.onDrop(event);
  }
}
