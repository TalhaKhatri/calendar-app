import { Component, Input, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment.model';
import { CdkDragMove, CdkDragStart } from '@angular/cdk/drag-drop';

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

  // Element being dragged
  private dragStartElement: HTMLElement | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  get dayNumber(): number {
    return this.date.getDate();
  }

  /**
   * Handle drag start event
   */
  onDragStarted(event: CdkDragStart, appointment: Appointment): void {
    // Get the dragging element
    this.dragStartElement = event.source.element.nativeElement;

    // Add a class to the source element to help with styling during drag
    this.dragStartElement.classList.add('dragging');

    // Add a class to the body to indicate dragging for styling purposes
    document.body.classList.add('appointment-dragging');

    // Disable transitions on preview
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
   * Handle drag move event
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
    }
  }
}
