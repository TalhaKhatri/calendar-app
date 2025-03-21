import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    // Format time (expecting HH:MM format)
    try {
      const [hours, minutes] = value.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return value;
      }

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for display

      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch (e) {
      return value;
    }
  }
}
