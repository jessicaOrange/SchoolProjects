////////////////////////////////////////////////////////////////////////////////////
//                              Settings Service                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: RESTful calls for calendar needed by the logged in user
 * CRUD
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   December, 27 2017    Cephas Mensah       Initial Calendar Service
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";

import 'rxjs/add/operator/map';

import { environment } from '../../environments/environment';
import {TravlendarUserModelService} from '../shared/datamodel/travlendar-user-model.service';
import {TravlendarUtils} from '../shared/travlendar-utils';

const URL =  environment.production ? 'https://travlendar.me/prod' : 'http://localhost:3000';

@Injectable()
export class TravlendarCalendarService {
  // private headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private userModel: TravlendarUserModelService
  ){}


  //Create User Calendar for current user: POST (${URL}/api/user/:userid/calendar)
  createTravlendarCalendar(userid, callback) {
    const hashKey = TravlendarUtils.getRandomHash(16);
    let payload = {
      summary: environment.production ? 'Travlendar Calendar' : 'Travlendar Calendar (dev)',
      description: 'Calendar Created by Travlendar Capstone Project\n\n[Do not alter or remove this line - TRAVLENDAR-CALENDAR-' + hashKey + ']',
      key: hashKey
    }

    this.http.post(`${URL}/api/user/${userid}/calendar`, payload, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('POST Calendar Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            if (data['message']['calendar']) {
              this.userModel.setCurrentUserCalendar(data['message']['calendar']);
            }
            if (data['message']['settings']) {
              this.userModel.setCurrentUserSettings(data['message']['settings']);
            }
            return callback (null, true);
          } else {
            return callback (false);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from calendar service POST: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback (err);
        }
      );
  }

  //Read User Settings for current user: GET (${URL}/api/user/:userid/calendar)
  readTravlendarCalendar (userid, callback) {
    return this.http.get(`${URL}/api/user/${userid}/calendar`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('READ Calendar Returned', this);
          TravlendarUtils.log(data, this);

          if (data['message']) {
            if (data['message']['calendar']) {
              this.userModel.setCurrentUserCalendar(data['message']['calendar']);
            }

            if (data['message']['settings']) {
              this.userModel.setCurrentUserSettings(data['message']['settings']);
            }
            return callback(null, true);
          }
        },
        err => {
          TravlendarUtils.log('Error encountered from calendar service GET: '.toUpperCase(), this);
          TravlendarUtils.log(err, this);
          return callback (err);
        }
      );
  }

  //Update User Settings for current user: PUT (${URL}/api/user/:userid/calendar/:calendarid)
  updateTravlendarCalendar (userid, calendarid, payload, callback) {
    this.http.put(`${URL}/api/user/${userid}/calendar/${calendarid}`, payload, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('PUT Settings Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            if (data['message']['calendar']) {
              this.userModel.setCurrentUserCalendar(data['message']['calendar']);
            }
            if (data['message']['settings']) {
              this.userModel.setCurrentUserSettings(data['message']['settings']);
            }
            return callback(null, true);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from calendar service PUT: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback(err);
        }
      );
  }

  //Delete User Settings for current user: DELETE (${URL}/api/user/:userid/calendar/:calendarid)
  deleteTravlendarCalendar (userid, calendarid, callback) {
    this.http.delete(`${URL}/api/user/${userid}/calendar/${calendarid}`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log(`DELETED Settings Returned ${data}`, this);
          if (data['status'] === 204) {
            this.userModel.deleteCurrentUserCalendar (data);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from calendar service DELETE: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);

          return callback(err);
        }
      );
  }
}

