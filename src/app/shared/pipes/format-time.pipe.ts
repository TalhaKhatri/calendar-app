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

      // Return in 24-hour format (HH:MM)
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      return value;
    }
  }
}
