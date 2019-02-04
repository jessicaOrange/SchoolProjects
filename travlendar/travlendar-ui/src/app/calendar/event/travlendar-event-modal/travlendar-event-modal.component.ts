////////////////////////////////////////////////////////////////////////////////////
//                         Travlendar Event Modal Component                       //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Component for event modal when creating new events.
 * References used:
 *    travlendar-tos-modal.component.html, travlendar-settings.component.html,
 *    travlendar-tos-modal.component.ts, https://getbootstrap.com/docs/4.0/components/modal/,
 *    https://www.w3schools.com/bootstrap/bootstrap_modal.asp
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Jan 22, 2018         Jason Rice          Created File (ts, html, css)
 *   Jan 31, 2018         Jason Rice          Changed style, layout, added event types and fields.
 *   Feb 01, 2018         Jason Rice          Added some minor things I forgot about, and updated format of code.
 *   Feb 02, 2018         Jason Rice          Changed the data model to the agreed structure and updated date handling.
 *   Feb 04, 2018         Cephas Mensah       Cleaning up the logic and removing some code which is not needed just now.
 *   Feb 06, 2018         Jason Rice          Added some form validation css and params to the html.
 *   Feb 10, 2018         Jason Rice          Added Google Places address auto-fill logic to the modal start and end address.
 *   Feb 22, 2017         Jason Rice          Removed the AGM stuff because since there was no current need for it.
 */
import {
  Component, ViewEncapsulation, Input, Output, EventEmitter, AfterContentChecked, OnInit, ViewChild,
  ElementRef, OnDestroy, AfterContentInit
} from '@angular/core';
import {TravlendarUtils} from '../../../shared/travlendar-utils';
import {NgForm} from '@angular/forms';
import {isNullOrUndefined} from 'util';
import {} from 'googlemaps';
import { RRule, RRuleSet, Options, Weekday } from 'rrule';
import {TravlendarSocketService} from "../../../shared/travlendar-shared.socket.service";
declare function require(name:string); var rrulestr = require('rrule').rrulestr;
declare var jQuery:any;

const MINUTES = 30 * 60 * 1000;
const ROUND_MINUTES = 30;

@Component({
  selector: 'app-travlendar-event-modal',
  templateUrl: './travlendar-event-modal.component.html',
  styleUrls: ['./travlendar-event-modal.component.css', '../../../shared/travlendar-shared.styles.css'],
  encapsulation: ViewEncapsulation.None
})

export class TravlendarEventModalComponent implements OnInit, AfterContentChecked, OnDestroy {
  // Output to the calendar
  @Output() eventModalSubmitted = new EventEmitter<object>();
  // Input from calendar
  @Input() eventData;

  travelOptions = ['Automobile', 'Bicycle', 'Transit', 'Walking'];
  recur = {
    'interval' : 'repeat-days',
    'num' : 1,
    'weekly' : [false, false, false, false, false, false, false],
    'monthly' : {'day' : null, 'monthweekday' : null},
    'stop' : {'occurances' : null, 'date' : null}
  };

  /*Model of event to be passed back to the calendar
    This model is set from the calendar but must be defined in the component so
   */
  eventModel = {
    resource: {
      summary: '',
      start: new Date(),
      end:  new Date(),
      description: '',
      reminders: { useDefault: true },
      location: '',
      recurrence: []
    },
    isAllDayEvent: false,

    isFloatingEvent: false,
    floatingConstraints: {start: null, end: null, duration: null},

    doesRepeat: false,

    overrideStartLocation: false,
    startLocation: {street: '', city: '', state: '', zipcode: '', country: 'US', lat: -1, lon: -1},
    endLocation: {street: '', city: '', state: '', zipcode: '', country: 'US', lat: -1, lon: -1},

    transportation: {usingRecommendation: true, override: ''},
    notification: {hasNotification: false, minutesPrior: 5}
  };

  start: Date;
  end: Date;
  time_diff: number;
  btnAction = 'Save';
  repeatOnMonthDay: string;
  repeatOnMonthDayOfWeek: string;

  @ViewChild('gglAddress') googleEventAddress: ElementRef;
  @ViewChild('gglSAddress') googleStartAddress: ElementRef;
  ngOnInit () {
    // Google auto complete logic
    this.linkGooglePlaces(this.googleEventAddress);
    this.linkGooglePlaces(this.googleStartAddress);
  }

  ngAfterContentChecked () {
    if (this.eventData) {
      // Check to see if recurring on initialization
      if(this.eventData.type && this.eventData.type == 'update' && this.eventData.eventModel) {
        this.eventModel = this.eventData.eventModel;

        // Get the recurrance rule
        if(this.eventModel.resource.recurrence && this.eventModel.resource.recurrence.length > 0) {
          TravlendarUtils.log("Repeat true");
          this.recurRuleToInput(rrulestr(this.eventModel.resource.recurrence[0]));
          this.eventModel.doesRepeat = true;
        } else {
          TravlendarUtils.log("Repeat false");
          this.eventModel.doesRepeat = false;
        }

        if(!this.eventModel.floatingConstraints)
          this.eventModel.floatingConstraints = {"start": null, "end": null, "duration": null};
      }

      //Checks to see if the user has specified modes of travel.
      if(this.eventData.travelOptions){
        this.travelOptions = this.eventData.travelOptions;
      }

      if (this.eventData.eventModel) {
        TravlendarUtils.log('Event fetch returned', this);
        this.eventModel = this.eventData.eventModel;
        this.btnAction = this.eventData.type === 'create' ? 'Save' : 'Edit';

        if(!this.eventModel.floatingConstraints)
          this.eventModel.floatingConstraints = {"start": null, "end": null, "duration": null};

        // storing old copy of the date so it could be used again when user toggles between all day and back
        if (!this.start) {
          this.start = this.eventModel.resource.start;
          this.end = this.eventModel.resource.end;
          this.time_diff = (new Date(this.eventModel.resource.end)).getTime() - (new Date (this.eventModel.resource.start)).getTime();
        }
      }
    }

    this.handleRepeatMonthlyText();
  }

  ngOnDestroy() {
    this.googleEventAddress.nativeElement.removeAllListeners();
    this.googleStartAddress.nativeElement.removeAllListeners();
  }

  addTimeValue (event: Event, type: string, isDate: boolean = false) {
    TravlendarUtils.log('Adding time addtimevalue()'.toUpperCase(), this);
    TravlendarUtils.log(event, this);

    let tempDate;

    if (isDate) {
      tempDate = event.toString().split('-');
      let tempDate1;
      if (type === 'start') {
        this.eventModel.resource.start = new Date(this.eventModel.resource.start.setFullYear(
          +tempDate[0], +tempDate[1] - 1, +tempDate[2]
        ));

        if (!this.eventModel.isAllDayEvent) {
          tempDate1 = this.eventModel.resource.end.toISOString().slice(0, 10).split('-');
          if (tempDate[0] > tempDate1[0] || tempDate[1] > tempDate1[1] || tempDate[2] > tempDate1[2]) {
            this.eventModel.resource.end = new Date(this.eventModel.resource.end.setFullYear(
              +tempDate[0], +tempDate[1] - 1, +tempDate[2]
            ));
          }
        }
      } else if (type === 'end') {
        this.eventModel.resource.end = new Date(this.eventModel.resource.end.setFullYear(
          +tempDate[0], +tempDate[1] - 1, +tempDate[2]
        ));
        tempDate1 = this.eventModel.resource.start.toISOString().slice(0, 10).split('-');
        if (tempDate1[0] > tempDate[0] || tempDate1[1] > tempDate[1] || tempDate1[2] > tempDate[2]) {
          this.eventModel.resource.start = new Date(this.eventModel.resource.start.setFullYear(
            +tempDate[0], +tempDate[1] - 1, +tempDate[2]
          ));
        }
      }
    } else {
      tempDate = event.toString().split(':');

      if (type === 'start') {
        let temp_start = new Date(this.eventModel.resource.start);
        temp_start.setHours(+tempDate[0], +tempDate[1], 0, 0);
        this.eventModel.resource.start = temp_start;
        this.eventModel.resource.end = new Date(this.eventModel.resource.start.getTime() + this.time_diff);
      } else if (type === 'end') {
        let temp_end = new Date(this.eventModel.resource.end);
        temp_end.setHours(+tempDate[0], +tempDate[1]);
        this.eventModel.resource.end = temp_end;
        let temp_start = new Date(this.eventModel.resource.start);

        if (temp_end.getTime() - temp_start.getTime() < ROUND_MINUTES) {
          this.eventModel.resource.start = new Date(temp_end.getTime() - this.time_diff);
        }
        this.time_diff = Math.abs(temp_end.getTime() - temp_start.getTime());
      }
    }

  }

  //This gets called when the form is submitted.
  onSubmit(eventForm: NgForm) {
    // Save the recurrance rule
    if(this.eventModel.doesRepeat) {
      this.eventModel.resource.recurrence = ['RRULE:'+this.recurRuleFromInput().toString()];
    } else {
      this.eventModel.resource.recurrence = null;
    }

    if (this.eventModel.isAllDayEvent) this.adjustDate();
    this.start = this.end = null;
    let validated = true;
    let addressValidated = true;
    let startValidated = true;

    try{
      for(let item in this.eventModel.endLocation) {
        if (this.eventModel.endLocation[item] === '') addressValidated = false;
        if (this.eventModel.overrideStartLocation && this.eventModel.startLocation[item] === '') startValidated = false;
      }
    }catch(err){
      validated = false;
    }

    if(!addressValidated){
      eventForm.form.controls['evnt-address'].markAsUntouched();
      eventForm.form.controls['evnt-address'].markAsDirty();
    }
    if(!startValidated){
      eventForm.form.controls['evnt-eaddress'].markAsUntouched();
      eventForm.form.controls['evnt-eaddress'].markAsDirty();
    }

    validated = (validated && addressValidated);
    if(this.eventModel.overrideStartLocation) validated = (validated && startValidated);

    if(validated) {
      this.eventModalSubmitted.emit(this.eventModel);
      this.clearAddressFields();
    }
  }

  onCancel () {
    this.eventModel = this.start = this.end = null;
    this.clearAddressFields();
  }

  clearAddressFields() {
    this.googleEventAddress.nativeElement.value = '';
    this.googleStartAddress.nativeElement.value = '';
  }

  adjustDate() {
    TravlendarUtils.log('Line 265 - Looking at allday event: '.toUpperCase() + this.eventModel.isAllDayEvent, this)
    this.eventModel.resource.start  = new Date(this.eventModel.resource.start);
    this.eventModel.resource.start.setHours(0,0,0,0);
    this.eventModel.resource.end = new Date(this.eventModel.resource.start);
    this.eventModel.resource.end.setHours(23, 59, 59, 999);
    TravlendarUtils.log('The resource: '.toUpperCase(), this);
    TravlendarUtils.log(this.eventModel, this);
    TravlendarUtils.log(this.eventModel.resource.end, this);
  }

  handleScheduling(invertAllDay, invertFloating) {
    if(invertAllDay) {
      this.eventModel.isAllDayEvent = !this.eventModel.isAllDayEvent;
    }

    if(invertFloating)
      this.eventModel.isFloatingEvent = !this.eventModel.isFloatingEvent;

    if(!this.eventModel.isFloatingEvent && !this.eventModel.isAllDayEvent) {
      // Normal non-floating, non-all day
      this.eventModel.resource.start = new Date(this.start);
      this.eventModel.resource.end = new Date(this.end);
    }
    else if(this.eventModel.isAllDayEvent && !this.eventModel.isFloatingEvent) {
      // All day
      this.eventModel.resource.start  = new Date(this.eventModel.resource.start);
      this.eventModel.resource.start.setHours(0,0,0,0);
      this.eventModel.resource.end = null;
    } else if(this.eventModel.isFloatingEvent && !this.eventModel.isAllDayEvent) {
      this.eventModel.floatingConstraints.start = new Date(this.eventModel.floatingConstraints.start);
      this.eventModel.floatingConstraints.end = new Date(this.eventModel.floatingConstraints.end);
    } else {
      // Invalid
    }
  }

  handleRepeatStopChange() {
    let stop = (<HTMLInputElement> document.getElementById('evnt-repeat-stop'));

    if(stop.value == 'repeat-stop-never') {
      this.recur.stop.occurances = null;
      this.recur.stop.date = null;
    } else if(stop.value == 'repeat-stop-on') {
      this.recur.stop.date = null;
    } else if(stop.value == 'repeat-stop-after') {
      this.recur.stop.occurances = null;
    }
  }

  handleRepeatWeeklyDay(day: number) {
    if(day > this.recur.weekly.length)
      return;
    else
      this.recur.weekly[day] = !this.recur.weekly[day];

    var found = false;
    for(var i = 0; i < 7; i++) {
      if(this.recur.weekly[i])
        found = true;
    }

    if(!found) {
      this.recur.weekly[day] = true;
    }
  }

  handleRepeatMonthlyText() {
    if(!this.eventModel)
      return;

    let monthCurrent = this.eventModel.resource.start.getMonth();
    let weekdayOfMonth = 0;

    var start = new Date(this.eventModel.resource.start);
    do {
      start = new Date(start);
      start.setDate(start.getDate() - 7);
      weekdayOfMonth++;
    } while(start.getMonth() == monthCurrent && weekdayOfMonth < 7)

    this.repeatOnMonthDay = this.eventModel.resource.start.getDate().toString();

    let weekdayOfMonthFormatted = weekdayOfMonth.toString();
    let lastDigit = weekdayOfMonthFormatted.split('').pop();
    if(lastDigit == '1') {
      weekdayOfMonthFormatted += 'st ';
    } else if(lastDigit == '2') {
      weekdayOfMonthFormatted += 'nd ';
    } else if(lastDigit == '3') {
      weekdayOfMonthFormatted += 'rd ';
    } else {
      weekdayOfMonthFormatted += 'th ';
    }

    if(start.getDay() == 0) {
      weekdayOfMonthFormatted += ' Sunday';
    } else if(start.getDay() == 1) {
      weekdayOfMonthFormatted += ' Monday';
    } else if(start.getDay() == 2) {
      weekdayOfMonthFormatted += ' Tuesday';
    } else if(start.getDay() == 3) {
      weekdayOfMonthFormatted += ' Wednesday';
    } else if(start.getDay() == 4) {
      weekdayOfMonthFormatted += ' Thursday';
    } else if(start.getDay() == 5) {
      weekdayOfMonthFormatted += ' Friday';
    } else if(start.getDay() == 6) {
      weekdayOfMonthFormatted += ' Saturday';
    }

    this.repeatOnMonthDayOfWeek = weekdayOfMonthFormatted;
  }

  recurRuleFromInput() {
    var options = {freq:null};

    // Frequency
    var frequency;
    switch(this.recur.interval) {
      case 'repeat-days': {
        frequency = RRule.DAILY;
        break;
      }
      case 'repeat-weeks': {
        frequency = RRule.WEEKLY;
        break;
      }
      case 'repeat-months': {
        frequency = RRule.MONTHLY;
        break;
      }
      case 'repeat-years': {
        frequency = RRule.YEARLY;
        break;
      }
      default: {
        frequency = RRule.DAILY;
        break;
      }
    }
    TravlendarUtils.log('Options');
    TravlendarUtils.log(options);
    TravlendarUtils.log('Freq');
    TravlendarUtils.log(frequency);
    options['freq'] = frequency;
    options['interval'] = this.recur.num;

    // Weekly
    if(frequency == RRule.WEEKLY) {
      var found = false;
      var rruleweekdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
      var weekdays = [];
      for(var i = 0; i < 7; i++) {
        if(this.recur.weekly[i]) {
          weekdays.push(rruleweekdays[i]);
          found = true;
        }
      }

      if(!found) {
        // Add a day if none are selected, this *shouldn't* happen per UI checks
        weekdays.push(RRule.SU);
      }

      options['byweekday'] = weekdays;
    }

    // Monthly
    if(frequency == RRule.MONTHLY) {
      // If on day # of the month
      if(this.recur.monthly.day != null)
        options['bymonthday'] = this.recur.monthly.day;
      // Or if by the # weekday of the month
      else if(this.recur.monthly.monthweekday != null)
        options['byweekday'] = RRule.FR.nth(this.recur.monthly.monthweekday);
    }

    // Ending
    if(this.recur.stop.occurances != null)
      options['count'] = this.recur.stop.occurances;
    else if(this.recur.stop.date != null)
      options['until'] = new Date(this.recur.stop.date);

    return new RRule(options);
  }

  recurRuleToInput(rule) {
    // Frequency
    if(rule.freq) {
      switch(rule.freq) {
        case RRule.DAILY: {
          this.recur.interval = 'repeat-days';
          break;
        }
        case RRule.WEEKLY: {
          this.recur.interval = 'repeat-weeks';
          break;
        }
        case RRule.MONTHLY: {
          this.recur.interval = 'repeat-months';
          break;
        }
        case RRule.YEARLY: {
          this.recur.interval = 'repeat-years';
          break;
        }
        default: {
          this.recur.interval = 'repeat-days';
          break;
        }
      }
    } else {
      this.recur.interval = 'repeat-days';
    }

    // Weekly
    if(rule.freq == RRule.WEEKLY && rule.byweekday != null) {
      if(rule.byweekday instanceof Weekday) {
        rule.byweekday = [rule.byweekday];
      }

      for(var i = 0; i < rule.byweekday.length; i++) {
        var day = rule.byweekday[i];
        switch(day) {
          case RRule.SU: {
            this.recur.weekly[0] = true;
            break;
          }
          case RRule.MO: {
            this.recur.weekly[1] = true;
            break;
          }
          case RRule.TU: {
            this.recur.weekly[2] = true;
            break;
          }
          case RRule.WE: {
            this.recur.weekly[3] = true;
            break;
          }
          case RRule.TH: {
            this.recur.weekly[4] = true;
            break;
          }
          case RRule.FR: {
            this.recur.weekly[5] = true;
            break;
          }
          case RRule.SA: {
            this.recur.weekly[6] = true;
            break;
          }
        }
      }
    } else {
      for(var i = 0; i < this.recur.weekly.length; i++) {
        this.recur.weekly[i] = false;
      }
    }

    // Monthly
    if(rule.freq == RRule.MONTHLY) {
      if(rule.bymonthday != null) {
        this.recur.monthly.day = rule.bymonthday;
        this.recur.monthly.monthweekday = null;
      } else if(rule.byweekday != null && rule.byweekday > 0) {
        this.recur.monthly.monthweekday = rule.byweekday;
        this.recur.monthly.day = null;
      } else {
        TravlendarUtils.log('Invalid recurrance rule monthly repeating value', this);
      }
    } else {
      this.recur.monthly.monthweekday = null;
      this.recur.monthly.day = null;
    }

    // Ending
    if(rule.count != null) {
      this.recur.stop.occurances = rule.count;
      this.recur.stop.date = null;
    } else if(rule.until != null) {
      this.recur.stop.date = rule.until;
      this.recur.stop.occurances = null;
    } else {
      this.recur.stop.date = null;
      this.recur.stop.occurances = null;
    }
  }

  /*
    Google auto complete logic
    Google maps address auto fill references:
      https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform,
      http://brianflove.com/2016/10/18/angular-2-google-maps-places-autocomplete/
  */
  private linkGooglePlaces(address) {
    let addressAutoComplete = new google.maps.places.Autocomplete(address.nativeElement);
    addressAutoComplete.addListener('place_changed', () => {
      let selectedAddress = addressAutoComplete.getPlace();
      if(!isNullOrUndefined(selectedAddress)){
        TravlendarUtils.log('Address Object Returned: ', this);
        TravlendarUtils.log(selectedAddress, this);
        if(address.nativeElement.id === 'evnt-eaddress'){
          TravlendarUtils.log('End Address selected: '+selectedAddress.formatted_address, this);
          this.eventModel.startLocation.lat = (selectedAddress.geometry.location.lat())?
            selectedAddress.geometry.location.lat() : -1;
          this.eventModel.startLocation.lon = (selectedAddress.geometry.location.lng())?
            selectedAddress.geometry.location.lng() : -1;
          this.breakDownAddressForModel(selectedAddress.formatted_address, this.eventModel.startLocation);
        } else if(address.nativeElement.id === 'evnt-address') {
          TravlendarUtils.log('Address selected: '+selectedAddress.formatted_address, this);
          this.eventModel.endLocation.lat = (selectedAddress.geometry.location.lat())?
            selectedAddress.geometry.location.lat() : -1;
          this.eventModel.endLocation.lon = (selectedAddress.geometry.location.lng())?
            selectedAddress.geometry.location.lng() : -1;
          this.eventModel.resource.location = selectedAddress.formatted_address;
          this.breakDownAddressForModel(selectedAddress.formatted_address, this.eventModel.endLocation);
        } else {
          TravlendarUtils.log("Invalid address specified", this);
        }
      }
    });
  }

  //Break down the address string to fit the eventModel object.
  private breakDownAddressForModel(address, location) {
    try{
      let addressElements = address.split(',');
      location.street = addressElements[0].trim();
      location.city = addressElements[1].trim();
      let stateZip = addressElements[2].split(' ');
      location.state = stateZip[1].trim();
      location.zipcode = stateZip[2].trim();
      location.country = addressElements[3].trim();
      TravlendarUtils.log('Location after breakdown: '+JSON.stringify(this.eventModel), this);
    } catch (Exception){
      TravlendarUtils.log('Exception occurred: '+ Exception.message, this);
    }
  }

  parseAddress = ((location) => {
    if (location['street'] === '') return '';
    return location['street'] + ', ' + location['city'] + ', ' + location['state'] + ', ' + location['country'];
  });
}
