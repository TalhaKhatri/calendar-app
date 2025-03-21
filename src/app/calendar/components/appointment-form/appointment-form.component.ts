import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AppointmentService } from '../../services/appointment.service';
import { Appointment } from 'src/app/shared/models/appointment.model';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.scss']
})
export class AppointmentFormComponent implements OnInit {
  appointmentForm!: FormGroup;
  isEditMode: boolean;
  availableColors = [
    { value: '#f44336', name: 'Red' },
    { value: '#e91e63', name: 'Pink' },
    { value: '#9c27b0', name: 'Purple' },
    { value: '#673ab7', name: 'Deep Purple' },
    { value: '#3f51b5', name: 'Indigo' },
    { value: '#2196f3', name: 'Blue' },
    { value: '#03a9f4', name: 'Light Blue' },
    { value: '#00bcd4', name: 'Cyan' },
    { value: '#009688', name: 'Teal' },
    { value: '#4caf50', name: 'Green' },
    { value: '#8bc34a', name: 'Light Green' },
    { value: '#cddc39', name: 'Lime' },
    { value: '#ffeb3b', name: 'Yellow' },
    { value: '#ffc107', name: 'Amber' },
    { value: '#ff9800', name: 'Orange' },
    { value: '#ff5722', name: 'Deep Orange' },
    { value: '#795548', name: 'Brown' },
    { value: '#9e9e9e', name: 'Grey' },
    { value: '#607d8b', name: 'Blue Grey' }
  ];

  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    public dialogRef: MatDialogRef<AppointmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'add' | 'edit', appointment?: Appointment }
  ) {
    this.isEditMode = data.mode === 'edit';
  }

  ngOnInit(): void {
    this.initForm();

    if (this.isEditMode && this.data.appointment) {
      this.appointmentForm.patchValue({
        title: this.data.appointment.title,
        description: this.data.appointment.description || '',
        date: new Date(this.data.appointment.date),
        startTime: this.data.appointment.startTime,
        endTime: this.data.appointment.endTime,
        color: this.data.appointment.color || ''
      });
    }
  }

  initForm(): void {
    this.appointmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      date: [new Date(), Validators.required],
      startTime: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      endTime: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      color: ['']
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid) {
      return;
    }

    const formValues = this.appointmentForm.value;

    if (this.isEditMode && this.data.appointment) {
      const updatedAppointment: Appointment = {
        ...this.data.appointment,
        title: formValues.title,
        description: formValues.description || undefined,
        date: formValues.date,
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        color: formValues.color || undefined
      };

      this.appointmentService.updateAppointment(updatedAppointment).subscribe(() => {
        this.dialogRef.close();
      });
    } else {
      const newAppointment: Omit<Appointment, 'id'> = {
        title: formValues.title,
        description: formValues.description || undefined,
        date: formValues.date,
        startTime: formValues.startTime,
        endTime: formValues.endTime,
        color: formValues.color || undefined
      };

      this.appointmentService.addAppointment(newAppointment).subscribe(() => {
        this.dialogRef.close();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
