import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentFormComponent } from '../../../calendar/components/appointment-form/appointment-form.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  openAddDialog(): void {
    this.dialog.open(AppointmentFormComponent, {
      width: '400px',
      data: {
        mode: 'add'
      },
      autoFocus: false,
      disableClose: false
    });
  }
}
