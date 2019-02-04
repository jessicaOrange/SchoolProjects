////////////////////////////////////////////////////////////////////////////////////
//                              Travel Event Service                             //
//////////////////////////////////////////////////////////////////////////////////
/*
 * Description: RESTful calls for event calls needed by the logged in user's calendar
 * CRUD
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Mar, 23 2017    Cephas Mensah       Initial Travel Event Service
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";

import 'rxjs/add/operator/map';

import { environment } from '../../../environments/environment';
import {TravlendarUserModelService} from '../../shared/datamodel/travlendar-user-model.service';
import {TravlendarUtils} from '../../shared/travlendar-utils';

const URL =  environment.production ? 'https://travlendar.me/prod' : 'http://localhost:3000';

@Injectable()
export class TravlendarTravelEventService {
  constructor(
    private http: HttpClient,
    private userModel: TravlendarUserModelService
  ){}

  // Read all Travel Events on Travlendar Calendar for current user: GET (${URL}/api/user/:userid/travel)
  readAllTravelEvents (userid, callback =  null) {
    TravlendarUtils.log('READ ALL TRAVEL EVENTS - LINE 33', this);
    return this.http.get(`${URL}/api/user/${userid}/travel`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null')
            TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];
          TravlendarUtils.log('Travel content - LINE 40: ', this);
          TravlendarUtils.log(data, this);

          if (data['message'] && data['message']['travel']) {
            TravlendarUtils.log('travels are back - LINE 44', this);
            this.userModel.setCurrentCalendarTravelEvents (data['message']['travel']);
            return callback ? callback (null, true) : true;
          }
        },
        err => {
          return callback ? callback (err) : false;
        }
      );
  }

  // Read one Event on Travlendar Calendar for current user: GET (${URL}/api/user/:userid/travel/:travelid)
  readOneTravelEvent (userid, travelid, callback = null) {
    TravlendarUtils.log('READ ONE TRAVEL EVENT - LINE 53', this);
    return this.http.get(`${URL}/api/user/${userid}/travel/${travelid}`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null')
            TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];
          if (data['message'] && data['message']['travel']) {
            TravlendarUtils.log('travels are back - LINE 62', this);
            return callback ? callback (null, data['message']['travel']) : data['message']['travel'];
          }
        },
        err => {
          return callback ? callback (err) : false;
        }
      );
  }

  //Delete one Event on Travlendar Calendar for current user: DELETE (${URL}/api/user/:userid/travel/:travelid)
  deleteTravelEvent (userid, travelid, callback = null) {
    this.http.delete(`${URL}/api/user/${userid}/travel/${travelid}`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null')
            TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));

          if (res['status'] === 204) {
            this.userModel.deleteCurrentCalendarTravelEvent (travelid);
            return callback ? callback (null, true) : true;
          }
        }, err => {
          return callback ? callback (err) : false;
        }
      );
  }
}
