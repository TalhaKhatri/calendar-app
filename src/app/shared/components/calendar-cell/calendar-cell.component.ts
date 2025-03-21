import { Component, Input, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment.model';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormComponent } from '../../../calendar/components/appointment-form/appointment-form.component';
import { AppointmentService } from 'src/app/calendar/services/appointment.service';

@Component({
  selector: 'app-calendar-cell',
  templateUrl: './calendar-cell.component.html',
  styleUrls: ['./calendar-cell.component.scss']
})
export class CalendarCellComponent implements OnInit {
  @Input() appointment!: Appointment;

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit(): void {
  }

  editAppointment(event: Event): void {
    event.stopPropagation();
    this.dialog.open(AppointmentFormComponent, {
      width: '400px',
      data: {
        mode: 'edit',
        appointment: this.appointment
      }
    });
  }

  deleteAppointment(event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this appointment?')) {
      this.appointmentService.deleteAppointment(this.appointment.id).subscribe();
    }
  }
}
