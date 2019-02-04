import { LOCALE_ID, Inject } from '@angular/core';
import { CalendarEventTitleFormatter, CalendarEvent } from 'angular-calendar';
import { DatePipe } from '@angular/common';

interface MyEvent extends CalendarEvent{
  conflict: string;
  travelTag: string;
}

export class CustomEventTitleFormatter extends CalendarEventTitleFormatter{
  constructor(@Inject(LOCALE_ID) private locale: string){
    super();
  }

  month(event: MyEvent): string{
    if(event.conflict && event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span> <span class="conflict-format">${event.conflict}</span>`;
    }
    if(event.travelTag && !event.conflict){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span>`;
    }

    if(event.conflict && !event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="conflict-format">${event.conflict}</span>`;
    }
    return `<b>${new DatePipe(this.locale).transform(
      event.start,
      'h:mm a',
      this.locale
    )}</b> <b>${event.title}</b>`;
  }

  week(event: MyEvent): string{
    if(event.conflict && event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span> <span class="conflict-format">${event.conflict}</span>`;
    }
    if(event.travelTag && !event.conflict){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span>`;
    }

    if(event.conflict && !event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="conflict-format">${event.conflict}</span>`;
    }
    return `<b>${new DatePipe(this.locale).transform(
      event.start,
      'h:mm a',
      this.locale
    )}</b> <b>${event.title}</b>`;
  }

  day(event: MyEvent): string{
    if(event.conflict && event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span> <span class="conflict-format">${event.conflict}</span>`;
    }
    if(event.travelTag && !event.conflict){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="travel-format">${event.travelTag}</span>`;
    }

    if(event.conflict && !event.travelTag){
      return `<b>${new DatePipe(this.locale).transform(
        event.start,
        'h:mm a',
        this.locale
      )}</b> <b>${event.title}</b> <span class="conflict-format">${event.conflict}</span>`;
    }
    return `<b>${new DatePipe(this.locale).transform(
      event.start,
      'h:mm a',
      this.locale
    )}</b> <b>${event.title}</b>`;
  }

}
