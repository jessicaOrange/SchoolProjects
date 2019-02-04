import { Component, Output, EventEmitter } from '@angular/core';
import { CalendarMonthViewComponent } from "angular-calendar";
import { MonthViewDay } from 'calendar-utils';
import Timer = NodeJS.Timer;

@Component({
  selector: 'my-calendar-month-view',
  template: `
    <div class="cal-month-view">
      <mwl-calendar-month-view-header
        [days]="columnHeaders"
        [locale]="locale"
        [customTemplate]="headerTemplate">
      </mwl-calendar-month-view-header>
      <div class="cal-days">
        <div *ngFor="let rowIndex of view.rowOffsets">
          <div class="cal-cell-row">
            <mwl-calendar-month-cell
              *ngFor="let day of view.days | slice : rowIndex : rowIndex + (view.totalDaysVisibleInWeek)"
              [class.cal-drag-over]="day.dragOver"
              [ngClass]="day?.cssClass"
              [day]="day"
              [openDay]="openDay"
              [locale]="locale"
              [tooltipPlacement]="tooltipPlacement"
              [tooltipAppendToBody]="tooltipAppendToBody"
              [tooltipTemplate]="tooltipTemplate"
              [customTemplate]="cellTemplate"
              (click)="singlyClickedEvent(day)"
              (dblclick)="doublyClickedEvent(day)"
              (mouseover)="dayMouseOver.emit({day: day})"
              (highlightDay)="toggleDayHighlight($event.event, true)"
              (unhighlightDay)="toggleDayHighlight($event.event, false)"
              (dragEnter)="day.dragOver = true"
              (dragLeave)="day.dragOver = false"
              (drop)="day.dragOver = false; eventDropped(day, $event.dropData.event)"
              (eventClicked)="eventClicked.emit({event: $event.event})">
            </mwl-calendar-month-cell>
          </div>
          <mwl-calendar-open-day-events
            [isOpen]="openRowIndex === rowIndex"
            [events]="openDay?.events"
            [customTemplate]="openDayEventsTemplate"
            (eventClicked)="eventClicked.emit({event: $event.event})">
          </mwl-calendar-open-day-events>
        </div>
      </div>
    </div>
  `
})

export class MyCalendarMonthViewComponent extends CalendarMonthViewComponent {
  timer: Timer;
  prevent: boolean = false;
  delay: number = 200;

  /**
   * Called when the day cell is double clicked
   */
  @Output()
  dayDoubleClicked: EventEmitter<{day: MonthViewDay }> = new EventEmitter<{
    day: MonthViewDay;
  }>();

  /**
   * Called when the day cell is mouse over
   */
  @Output()
  dayMouseOver: EventEmitter<{day: MonthViewDay }> = new EventEmitter<{
    day: MonthViewDay;
  }>();

  singlyClickedEvent(day: MonthViewDay): void {
    this.timer = setTimeout(()=>{
      if (!this.prevent){
        this.dayClicked.emit({day: day});
      }
      this.prevent = false;
    }, this.delay);
  }

  doublyClickedEvent(day: MonthViewDay): void {
    clearTimeout(this.timer);
    this.prevent = true;
    this.dayDoubleClicked.emit({day: day});
  }

}
