import {Component, OnDestroy, OnInit, ChangeDetectionStrategy, ViewEncapsulation} from '@angular/core';
import {TravlendarUserModelService} from '../shared/datamodel/travlendar-user-model.service';
import {TravlendarCalendarService} from './travlendar-calendar.service';
import {TravlendarUtils} from '../shared/travlendar-utils';
import {Subscription} from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import {CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarMonthViewDay, CalendarEventTitleFormatter} from 'angular-calendar';
import {endOfWeek, getMonth, startOfMonth, startOfWeek, startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours} from 'date-fns';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {TravlendarSettingsService} from "../settings/travlendar-settings.service";
import {TravlendarAuthorizationService} from '../core/travlendar-authorization.service';
import {TravlendarEventService} from './event/travlendar-event.service';
import { CustomEventTitleFormatter } from './event/custom-event-title-formatter.provider';
import {TravlendarSocketService} from '../shared/travlendar-shared.socket.service';
import {TravlendarTravelEventService} from './travel/travlendar-travel.service';

interface MyEvent extends CalendarEvent{
  conflict: string;
  travelTag: string;
}

declare var jQuery:any;

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#f6aeb6'
  },
  pink: {
    primary: '#CD7979',
    secondary: '#CD7979',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#aecff6'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#f6f5ae'
  },
  green: {
    primary: '#44f40e',
    secondary: '#aef6cc'
  },
  purple: {
    primary: '#af0ef4',
    secondary: '#f6aef4'
  },
  orange: {
    primary: '#f49f0d',
    secondary: '#f6dfae'
  },
  salmon: {
    primary: '#FFA07A',
    secondary: '#f6cbae'
  }
};
const MINUTES = 30 * 60 * 1000;
const ROUND_MINUTES = 30;

@Component({
  selector: 'travlendar-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['travlendar-calendar.component.css'],
  templateUrl: 'travlendar-calendar.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: CalendarEventTitleFormatter,
      useClass: CustomEventTitleFormatter
    }
  ]
})
export class TravlendarCalendarComponent implements OnInit, OnDestroy {
  // Variables for front end view presentation
  activeDayIsOpen: boolean = false;

  view: string = 'week';

  viewDate: Date = new Date();

  selectedMonthViewDay: CalendarMonthViewDay;

  spinnerIsOn: boolean = true;


  //TODO <------------------------------------------------------------------>
  //variable travelOptions should be replaced with users travel settings in the form of []
  eventData = {
    travelOptions : undefined,
    eventModel: undefined,
    date: undefined
  };

  travelEventData = {
    travelEventModel: undefined
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: MyEvent }): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: MyEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: MyEvent[] = [];

  private userData: object;
  private subscribeUser: Subscription;

  constructor(private userModelService: TravlendarUserModelService,
              private calendarService: TravlendarCalendarService,
              private eventService: TravlendarEventService,
              private travelService: TravlendarTravelEventService,
              private settingService: TravlendarSettingsService,
              private authService: TravlendarAuthorizationService,
              private socketService: TravlendarSocketService,
              private modal: NgbModal
  ) {}

  ngOnInit() {
    this.userData = this.userModelService.getUserData();

    this.socketService.getData(this.userData['_id'])
      .subscribe((data) => {
        const message = data['message'], items = data['data'], id = data['id'];
        console.log('Socket data should be getting pushed - line 138');
        console.log(data);
        if (message != null) {
          if (message === 'event' || message === 'clones' || message === 'notification') {
            console.log('We have events');
            this.userModelService.setCurrentCalendarEvents(items);
          } else if (message === 'travel') {
            console.log('We are traveling');
            this.userModelService.setCurrentCalendarTravelEvents (items);
          }
        }
      });

    this.subscribeUser = this.userModelService.userDataChanged
      .subscribe((data: object) => {
        if (data && data['calendar']) {
          this.userData = data;
        }

        if (data && data['settings']) {
          this.view = this.userData['settings']['defaultCalView'] ?
            this.userData['settings']['defaultCalView'].toLowerCase() : 'day';
          this.eventData.travelOptions = data['settings']['modeOfTravel'];
        }

        if (data && data['event']) {
          this.events = [];
          for (let event of data['event']) {
            event['actions'] = this.actions;

            if (event['isConflict']) {
              event['color'] = colors.red;
              event['conflict'] = 'Conflict!';
            } else if (event['isWarning']) {
              event['color'] = colors.salmon;
              event['conflict'] = 'Warning!';
            } else if (event['isFloating']) {
              event['color'] = colors.purple;
            } else if (event['allDay']){
              event['color'] = colors.yellow;
            } else {
              event['color'] = colors.blue;
            }

            event['draggable'] = false;
            event['resizable'] = { beforeStart: false, afterEnd: false };
            this.events.push(event);
          }
        }

        if (data && data['travel']){
          TravlendarUtils.log('We got some travel event back: ', this);
          TravlendarUtils.log(data['travel'], this);
          for(let travelEvent of data['travel']){
            travelEvent['title'] = 'Traveling Duration';
            travelEvent['color'] = colors.green;
            travelEvent['travelTag'] = 'Travel Event';
            this.events.push(travelEvent);
          }
        }

        this.refresh.next(this.events);
      });

    this.calendarService.readTravlendarCalendar (this.userData['_id'], (err, cals) => {
      if (err) {
        if (err['status'] === 401) return this.authService.logOut(err);

        if (err['error']['message'] === 'user does not have a Travlendar Calendar setup') {
          TravlendarUtils.log('Creating a new Travlendar Calendar', this);
          return this.calendarService.createTravlendarCalendar(this.userData['_id'], (err, travlendar) => {
            if (err) return TravlendarUtils.log(err, this);

            this.getSettings(this.userData['_id']);
            return;
          });
        }
      }

      this.getSettings(this.userData['_id']);

      return;
    });
  }

  daySelected (day: CalendarMonthViewDay): void {
    if (this.selectedMonthViewDay) {
      delete this.selectedMonthViewDay.cssClass;
    }

    day.cssClass = 'cal-day-selected';
    this.selectedMonthViewDay = day;
  }

  dayClicked({ date, events }: { date: Date; events: MyEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate=date;
      }
    }
  }

//TODO <------------------------------------------------------------------>
  saveEvent(event:object) {
    if (this.eventData['type'] === 'create') {
      this.eventService.createTravlendarCalendar(this.userData['_id'], event, this.itemSaved);
    } else if (this.eventData['type'] === 'update') {
      this.eventService.updateEvent(this.userData['_id'], event['_id'], event, this.itemSaved);
    }
  }

  eventTimesChanged({
                      event,
                      newStart,
                      newEnd
                    }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.eventData.eventModel.resource.start = newStart;
    this.eventData.eventModel.resource.end = newEnd;
    this.eventService.updateEvent(this.userData['_id'], event['meta']['_id'], event, function(err, wasUpdated) {
      this.refresh.next();

      if (err) return;
      if (wasUpdated) TravlendarUtils.log("Event updated successfully", this);
      this.eventData['type'] = null;
    });
  }

//TODO <---------------------------------------------------------------->
  showTheEvent(event: MyEvent):void {
    TravlendarUtils.log('Showing event for clicked item', this);
    TravlendarUtils.log(event, this);

    // Event clicked is a travel event
    if(event.travelTag){
      this.showTheTravelEvent(event);
    }
    else{
      // Fetching event from the backend to display in the Modal
      this.eventService.readOneEvent(this.userData['_id'], event['meta']['_id'], (err, item) => {
        let temp = new Date (item.resource.start);
        item.resource.start = null;
        item.resource.start = temp;

        temp = new Date (item.resource.end);
        item.resource.end = null;
        item.resource.end = temp;

        if (err) return TravlendarUtils.log('Error Occurred', this);

        this.eventData.eventModel = item;
        this.eventData['type'] = 'update';

        jQuery('#eventModal').modal('toggle');
        return;
      });
    }
  }

  createNewEvent(date: Date = null): void {
    TravlendarUtils.log('Event Modal triggered.'.toUpperCase(), this);

    let start = new Date();
    /*
      Rounding off minutes
      https://stackoverflow.com/questions/4968250/how-to-round-time-to-the-nearest-quarter-hour-in-javascript
    */

    let m = (Math.ceil(start.getMinutes() / ROUND_MINUTES) * ROUND_MINUTES);
    start.setHours(start.getHours() + Math.floor(m / 60));
    start.setMinutes(m % 60);
    let end = new Date(start.getTime() + MINUTES);

    let eventModel = {
      resource: {
        summary: '',
        start: date ? date : start,
        end:  date ? date.getTime() + MINUTES : end,
        description: '',
        reminders: { useDefault: true },
        location: '',
        recurrence: []
      },

      isAllDayEvent: false,
      isFloatingEvent: false,
      floatingConstraints: null,

      overrideStartLocation: false,
      startLocation: {street: '', city: '', state: '', zipcode: '', country: 'US', lat: -1, lon: -1},
      endLocation: {street: '', city: '', state: '', zipcode: '', country: 'US', lat: -1, lon: -1},

      transportation: {usingRecommendation: true, to: '', from: ''},
      notification: {hasNotification: false, minutesPrior: 5}
    };

    this.eventData.eventModel = eventModel;
    this.eventData['type'] = 'create';
    jQuery('#eventModal').modal('toggle');
  }

  showTheTravelEvent(travelEvent: MyEvent):void{
    TravlendarUtils.log('Showing travel event for clicked item', this);
    TravlendarUtils.log(travelEvent, this);

    this.travelService.readOneTravelEvent(this.userData['_id'], travelEvent['meta']['_id'], (err, item)=>{
      TravlendarUtils.log('Travel Event fetch returned', this);
      TravlendarUtils.log(err, this);
      TravlendarUtils.log(item, this);

      let tempStart = new Date(item.travelStartTime);
      item.travelStartTime = null;
      item.travelStartTime = tempStart;

      let tempEnd = new Date(item.travelEndTime);
      item.travelEndTime = null;
      item.travelEndTime = tempEnd;

      let tempTimeEstimate = Number(item.travelTimeEstimate);
      item.travelTimeEstimate = null;
      item.travelTimeEstimate = Math.round(tempTimeEstimate / 60);

      if (err) return TravlendarUtils.log('Error Occurred', this);

      this.travelEventData.travelEventModel = item;
      jQuery('#travelModal').modal('toggle');
      return;
    });
  }

  private deleteEvent (event: MyEvent): void {
    this.eventService.deleteEvent(this.userData['_id'], event['meta']['_id'], (err, isDeleted) => {
      if (err) return;
      if (isDeleted)  this.refresh.next();
    });
  }

  private indexOfEvent(event: MyEvent): number{
    console.log(event.meta._id);
    for(var i=0;i<this.events.length;i++) {
      console.log(this.events[i].meta._id);
      if (this.events[i].meta._id === event.meta._id) {
        return i;
      }
    }
    return -1;
  }

  private handleEvent(action: string, event: MyEvent): void {
    switch (action.toLowerCase()) {
      case 'deleted':
        this.deleteEvent(event);
        break;
      case 'edited':
        this.showTheEvent(event);
        break;
      default:
        TravlendarUtils.log(`An action: (${action}) was taken and needs to be handled`, this);
    }
  }

  private getSettings (userid): void {
    this.settingService.readUserSettings(userid, (err, setting) => {
      if(err) return;
      if(setting) {
        return this.eventService.readAllEvents(this.userData['_id'], (err, isPulled) => {
          this.spinnerIsOn = false;
          this.refresh.next();
          if (err) return;
          this.travelService.readAllTravelEvents(this.userData['_id']);
        });
      }
    });
  }

  private itemSaved(err = null, isSaved: boolean) {
    if (err) return;
    if (isSaved) return jQuery('#eventModal').modal('toggle');
    this.eventData['type'] = null;
  }

  private refreshAndReload() {
    location.reload();
  }

  ngOnDestroy() {
    this.subscribeUser.unsubscribe();
  }
}
