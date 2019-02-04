////////////////////////////////////////////////////////////////////////////////////
//                              Settings Service                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: RESTful calls for settings needed by the logged in user
 * CRUD
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   November 21, 2017    Cephas Mensah       Initial Settings Service
 *   December 26, 2017    Cephas Mensah       Completed Settings Service
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import 'rxjs/add/operator/map';
import { environment } from '../../environments/environment';
import {TravlendarUserModelService} from '../shared/datamodel/travlendar-user-model.service';
import {TravlendarUtils} from '../shared/travlendar-utils';
import {Router} from "@angular/router";

const URL =  environment.production ? 'https://travlendar.me/prod' : 'http://localhost:3000';

@Injectable()
export class TravlendarSettingsService {
  // private headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private userModel: TravlendarUserModelService,
    private router: Router
  ){}

  // Create User Settings for current user: POST (${URL}/api/user/:userid/settings)
  createUserSettings(userid, settings, callback) {
    this.http.post(`${URL}/api/user/${userid}/settings`, settings, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('POST Settings Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            this.userModel.setCurrentUserSettings(data['message']['settings']);
            return callback(null, true);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from settings service POST: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback(false);
        }
      );
  }

  // Read User Settings for current user: GET (${URL}/api/user/:userid/settings)
  readUserSettings(userid, callback) {
    TravlendarUtils.log('This has been called to read', this);
    return this.http.get(`${URL}/api/user/${userid}/settings`, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('GET Settings Returned Data', this);
          TravlendarUtils.log(data, this);

          if (data['message']) {
            if (data['message']['settings']) {
              this.userModel.setCurrentUserSettings(data['message']['settings']);
            } else {
              this.router.navigate(['/settings']);
            }
            return callback (null, data['message']['gCalendars']);
          }
        },
        err => {
          TravlendarUtils.log('Error encountered from settings service GET: '.toUpperCase(), this);
          TravlendarUtils.log(err, this);

          return callback(err);
        }
      );
  }

  // Update User Settings for current user: PUT (${URL}/api/user/:userid/settings)
  updateUserSettings(userid, settings, callback) {
    this.http.put(`${URL}/api/user/${userid}/settings`, settings, {headers: TravlendarUtils.getHeaders(), observe: 'response'})
      .subscribe(
        res => {
          if (res.headers.get('Authorization') !== 'null') TravlendarUtils.setSessionAccessToken(res.headers.get('Authorization'));
          let data = res['body'];

          TravlendarUtils.log('PUT Settings Returned', this);
          TravlendarUtils.log(data, this);
          if (data['message']) {
            this.userModel.setCurrentUserSettings(data['message']['settings']);
            return callback(null, true);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from settings service PUT: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);

          return callback(false);
        }
      );
  }

  //Delete User Settings for current user: DELETE (${URL}/api/user/:userid/settings)
  deleteUserSettings(userid, callback) {
    this.http.delete(`${URL}/api/user/${userid}/settings`, {headers: TravlendarUtils.getHeaders()})
      .subscribe(
        data => {
          TravlendarUtils.log(`DELETED Settings Returned ${data}`, this);

          if (data['status'] === 204) {
            this.userModel.deleteCurrentUserSettings(data);
          }
        }, err => {
          TravlendarUtils.log('Error encountered from settings service DELETE: '.toLowerCase(), this);
          TravlendarUtils.log(err, this);
          return callback(err);
        }
      );
  }
}
