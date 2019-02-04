////////////////////////////////////////////////////////////////////////////////////
//                              Authorization Service                             //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Service to make calls to the server relating to authorization
 *  and basic user data such as TOS acceptance, and authorization token.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE *
 *   Nov 19, 2017         Cephas Mensah       Creating a User Model for simplicity later
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import {TravlendarUtils, LOG} from '../travlendar-utils';

@Injectable()
export class TravlendarUserModelService {
  private currUserData: object;
  userDataChanged = new Subject<object>();

  constructor() {
    this.currUserData = null;
    this.userDataChanged.next(this.currUserData);
  }

  setCurrentUser (user, tos = false): void {
    this.currUserData = {
      'name': user.name,
      'username': user.g_username,
      'termsOfService': user.termsOfService,
      'g_username': user.g_username,
      'authorization': user.authorization
    };

    if (tos) {
      TravlendarUtils.log('Current User', this);
      TravlendarUtils.log(user, this);
      this.currUserData['_id'] = user._id;
      this.setSessionStorage(this.currUserData);
    } else {
      this.currUserData['credentials'] = user.credentials;
    }

    this.userDataChanged.next(this.currUserData);
  }

  setCurrentUserSettings (settings): void {
    TravlendarUtils.log('Current User Settings', this);
    TravlendarUtils.log(settings, this);

    if (settings) {
      this.currUserData['settings'] = {
        defaultCalView: settings['defaultCalView'] ? settings['defaultCalView'] : null,
        cloneCalendar: settings['cloneCalendar'] ? settings['cloneCalendar'] : null,
        modeOfTravel: settings['modeOfTravel'] ? settings['modeOfTravel'] : null,
        preferredTransitModes: (settings['preferredTransitModes'])? settings['preferredTransitModes'] : null,
        startAddress: settings['startAddress'] ? settings['startAddress'] : null
      };
      this.userDataChanged.next(this.currUserData);
    }
  }

  setCurrentUserCalendar (calendar): void {
    TravlendarUtils.log('Current User Calendar', this);
    TravlendarUtils.log(calendar, this);

    if (calendar) {
      this.currUserData['calendar'] = {
        gCal_summary: calendar['gCal_summary'],
        gCal_id: calendar['gCal_id'],
        defaultCalView: calendar['defaultCalView']
      };

      this.userDataChanged.next(this.currUserData);
    }
  }

  setCurrentCalendarEvents (events): void {
    TravlendarUtils.log('Set Current Event(s)', this);
    TravlendarUtils.log(events, this);

    let objEvent;

    this.currUserData['event'] = [];
    for (let event of events) {
      objEvent = {
        meta: {_id: event['_id']},
        title: event['summary'],
        start: new Date(event['start']),
        end: new Date(event['end']),
        allDay: event['isAllDayEvent'],
        isWarning: event['isWarning'],
        isConflict: event['isConflict']
      };

      this.currUserData['event'].push(objEvent);
    }

    if (this.currUserData['event'].length > 0) {
      this.userDataChanged.next(this.currUserData);
    }
  }

  updateCurrentCalendarEvent (event, type: string): void {
    TravlendarUtils.log(`${type} Current Event`, this);
    TravlendarUtils.log(event, this);

    if (event) {
      switch (type.toLocaleLowerCase()) {
        case 'create':
          if (!this.currUserData['event']) {
            this.currUserData['event'] = [];
          }
          this.currUserData['event'].push({
            meta: {_id: event['_id']},
            title: event['summary'],
            start: new Date(event['start']),
            end: new Date(event['end']),
            allDay: event['isAllDayEvent'],
            isWarning: event['isWarning'],
            isConflict: event['isConflict']
          });
          break;
        case 'update':
          for (let item of this.currUserData['event']) {
            if (item['meta']['_id'] === event['_id']) {
              console.log('event found to update');
              item = {
                title: event['summary'],
                start: new Date(event['start']),
                end: new Date(event['end']),
                allDay: event['isAllDayEvent'],
                isWarning: event['isWarning'],
                isConflict: event['isConflict']
              };
            }
          }
          break;
        default:
          TravlendarUtils.log('Missing a parameter??');
      }
      this.userDataChanged.next(this.currUserData);
    }
  }

  deleteCurrentUserCalendar (calendar): void {
    this.currUserData['calendar'] = null;
    this.userDataChanged.next(this.currUserData);
  }

  deleteCurrentUserSettings (settings): void {
    this.currUserData['settings'] = null;
    this.userDataChanged.next(this.currUserData);
  }

  deleteCurrentCalendarEvent (eventid): void {
    for (let event of this.currUserData['event']) {
      if (event['meta']['_id'] === eventid) {
        let index = this.currUserData['event'].indexOf(event);
        this.currUserData['event'].splice(index, 1);
        this.userDataChanged.next(this.currUserData);
        console.log('event found and deleted!'.toUpperCase());
        break;
      }
    };
  }

  setCurrentCalendarTravelEvents (travelEvents): void {
    let objEvent;
    this.currUserData['travel'] = [];
    console.log('We are setting Travel events - LINE 170');

    for (let travel of travelEvents) {
      console.log('LINE 172: ' + travel['_id']);
      objEvent = {
        meta: {_id: travel['_id']},
        start: new Date(travel['travelStartTime']),
        end: new Date(travel['travelEndTime']),
        timeEstimate: travel['travelTimeEstimate'],
        travelMode: travel['travelMode']
      };

      this.currUserData['travel'].push(objEvent);
    }

    if (this.currUserData['travel'].length > 0) {
      console.log('pushed travel items LINE 186: ' + this.currUserData['travel'].length);
      this.userDataChanged.next(this.currUserData);
    }
  }

  setCurrentCalendarTravelEvent (travelEvent): void {
    let objEvent;
    this.currUserData['travel'] = this.currUserData['travel'] ? this.currUserData['travel'] : [];
    objEvent = {
      meta: {_id: travelEvent['_id']},
      start: new Date(travelEvent['travelStartTime']),
      end: new Date(travelEvent['travelEndTime']),
      travelTimeEstimate: travelEvent['travelTimeEstimate'],
      travelMode: travelEvent['travelMode']
    };

    this.currUserData['travel'].push(objEvent);

    if (this.currUserData['travel'].length > 0) {
      this.userDataChanged.next(this.currUserData);
    }
  }

  deleteCurrentCalendarTravelEvent (travelid): void {
    for (let travelEvent of this.currUserData['travel']) {
      if (travelEvent['_id'] === travelid) {
        this.currUserData['event'].remove(travelEvent);
        this.userDataChanged.next(this.currUserData);
        break;
      }
    };
  }

  getUserData(): object {
    TravlendarUtils.log('Is data set? LINE 218' + (sessionStorage.getItem('user') != null));
    TravlendarUtils.log('Is data set? LINE 218' + (this.currUserData != null));
    return this.currUserData;
  };

  removeSessionStorage(storageKey: string = null): void {
    if (storageKey) {
      sessionStorage.clear();
      this.currUserData = null;
      this.userDataChanged.next(this.currUserData);
    }
  }

  private setSessionStorage(userData = null): void {
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify({'_id': userData._id}));
      sessionStorage.setItem('access_token', JSON.stringify(userData.authorization));
      sessionStorage.setItem('auth', 'true');
    }
  }
}
