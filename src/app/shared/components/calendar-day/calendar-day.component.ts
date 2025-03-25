import { Component, Input, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment.model';
import { CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';
import { DateService } from '../../services/date.service';
import { DragDropService } from '../../services/drag-drop.service';

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

  constructor(
    private dateService: DateService,
    private dragDropService: DragDropService
  ) {}

  ngOnInit(): void {
    // Component initialization code if needed
  }

  get dayNumber(): number {
    return this.date.getDate();
  }

  /**
   * Delegate drag start handling to the DragDropService
   */
  onDragStarted(event: CdkDragStart, appointment: Appointment): void {
    this.dragDropService.onDragStarted(event, appointment);
  }

  /**
   * Delegate drag move handling to the DragDropService
   */
  onDragMoved(event: CdkDragMove<any>): void {
    this.dragDropService.onDragMoved(event);
  }
}
