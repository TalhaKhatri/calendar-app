import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CalendarDayComponent } from './components/calendar-day/calendar-day.component';
import { CalendarCellComponent } from './components/calendar-cell/calendar-cell.component';
import { FormatTimePipe } from './pipes/format-time.pipe';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';

@NgModule({
  declarations: [
    CalendarDayComponent,
    CalendarCellComponent,
    FormatTimePipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    CalendarDayComponent,
    CalendarCellComponent,
    FormatTimePipe
  ]
})
export class SharedModule { }
