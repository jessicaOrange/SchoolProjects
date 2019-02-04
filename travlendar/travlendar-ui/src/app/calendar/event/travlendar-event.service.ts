////////////////////////////////////////////////////////////////////////////////////
//                              Settings Service                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: RESTful calls for event calls needed by the logged in user's calendar
 * CRUD
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Feb, 06 2017    Cephas Mensah       Initial Event Service
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";

import 'rxjs/add/operator/map';

import { environment } from '../../../environments/environment';
import {TravlendarUserModelService} from '../../shared/datamodel/travlendar-user-model.service';
import {TravlendarUtils} from '../../shared/travlendar-utils';

const URL =  environment.production ? 'https://travlendar.me/prod' : 'http://localhost:3000';

@Injectable()
export class TravlendarEventService {
  constructor(
    private http: HttpClient,
    private userModel: TravlendarUserModelService
  ){}

  // Create new Event on Travlendar Calendar for current user: POST (${URL}/api/user/:userid/event)
  createTravlendarCalendar(userid, payload, callback = null) {
    this.http.post(`${URL}/api/user/${userid}/event`, payload, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('POST Event Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            if (data['message']['event']) {
              this.userModel.updateCurrentCalendarEvent(data['message']['event'], 'create');
            }

            return callback ? callback (null, true) : true;
          }
        }, err => {
          TravlendarUtils.log('Error encountered from event service POST: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback ? callback (err) : false;
        }
      );
  }

  // Read all Events on Travlendar Calendar for current user: GET (${URL}/api/user/:userid/event)
  readAllEvents (userid, callback =  null) {
    return this.http.get(`${URL}/api/user/${userid}/event`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('READ all Events Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            if (data['message']['event']) {
              this.userModel.setCurrentCalendarEvents (data['message']['event']);
            }

            return callback ? callback (null, true) : true;
          }
        },
        err => {
          TravlendarUtils.log('Error encountered from event service GET all: '.toUpperCase(), this);
          TravlendarUtils.log(err, this);
          return callback ? callback (err) : false;
        }
      );
  }

  // Read one Event on Travlendar Calendar for current user: GET (${URL}/api/user/:userid/event/:eventid)
  readOneEvent (userid, eventid, callback = null) {
    return this.http.get(`${URL}/api/user/${userid}/event/${eventid}`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('READ one Event Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message'] && data['message']['event']) {
            return callback ? callback(null, data['message']['event']) : data['message']['event'];
          }
        },
        err => {
          TravlendarUtils.log('Error encountered from event service GET one: '.toUpperCase(), this);
          TravlendarUtils.log(err, this);
          return callback ? callback (err) : false;
        }
      );
  }

  // Update one Event on Travlendar Calendar for current user: PUT (${URL}/api/user/:userid/event/:eventid)
  updateEvent (userid, eventid, payload, callback) {
    this.http.put(`${URL}/api/user/${userid}/event/${eventid}`, payload, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('PUT one Event Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            if (data['message']['event']) {
              this.userModel.updateCurrentCalendarEvent (data['message']['event'], 'update');
            }

            return callback(null, true);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from event service PUT: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback(err);
        }
      );
  }

  //Delete one Event on Travlendar Calendar for current user: DELETE (${URL}/api/user/:userid/event/:eventid)
  deleteEvent (userid, eventid, callback = null) {
    this.http.delete(`${URL}/api/user/${userid}/event/${eventid}`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));

          TravlendarUtils.log('DELETED one Event Returned'.toUpperCase(), this);
          TravlendarUtils.log(eventid, this);

          if (res['status'] === 204) {
            this.userModel.deleteCurrentCalendarEvent (eventid);
            return callback ? callback (null, true) : true;
          }
        }, err => {
          TravlendarUtils.log('Error encountered from event service DELETE: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);

          return callback ? callback (err) : false;
        }
      );
  }
}
