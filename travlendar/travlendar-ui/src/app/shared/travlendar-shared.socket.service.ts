////////////////////////////////////////////////////////////////////////////////////
//                              Socket Service                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: RESTful calls for calendar needed by the logged in user
 * CRUD
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   March, 2nd 2018    Cephas Mensah       Service for Socket
 */

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as io from 'socket.io-client';
import {Observable} from "rxjs/Observable";

const URL =  environment.production ? 'https://travlendar.me/socket.io' : 'http://localhost:3000';

@Injectable()
export class TravlendarSocketService {
  private socket = null;

  private connectSocket = (_id) => {
    this.socket = io(URL, {query: `uid=${_id}`, secure: true, reconnect: true, rejectUnauthorized : false });
    this.socket.connect();
  };

  public getData = (_id) => {
    if (!this.socket) {
      this.connectSocket(_id);
    }
    return Observable.create((observer) => {
      this.socket.on('travlendar', (data) => {
        console.log('Received data line 35');
        console.log(data);
        observer.next(data);
      });
    });
  };
}
