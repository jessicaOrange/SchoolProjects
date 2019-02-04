////////////////////////////////////////////////////////////////////////////////////
//                              Authorization Service                             //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Service to make calls to the server relating to authorization
 *  and basic user data such as TOS acceptance, and authorization token.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 1, 2017          Jason Rice          Created File.
 *   Nov 3, 2017          Jason Rice          Revamped the file completely.
 *   Nov 13, 2017         Jason Rice          Changed for checks and to add auth to session storage.
 *   Nov 16, 2017         Jason Rice          Added the accept functionality and create user request.
 *   Nov 19, 2017         Cephas Mensah       Revamped auth service file.
 *   Nov 26, 2017         Jason Rice          Changed the logout function because of the button reload issue.
 */

import {Injectable} from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient } from '@angular/common/http';

import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';

import { environment } from '../../environments/environment';
import {TravlendarUserModelService} from '../shared/datamodel/travlendar-user-model.service';
import {isNullOrUndefined} from 'util';
import {TravlendarUtils} from '../shared/travlendar-utils';

const URL =  environment.production ? 'https://travlendar.me/prod' : 'http://localhost:3000';
const REDIRECT = environment.production ? 'https://travlendar.me/oauth?code=' : 'http://localhost:4200/oauth?code=';

@Injectable()
export class TravlendarAuthorizationService {
  // private headers: HttpHeaders;
  private subscriber: Subscription;
  private userData;
  private authorized: boolean;
  private loginRouteState: string;
  authChanged = new Subject<boolean>();

  constructor(private http: HttpClient,
              private router: Router,
              private userModel: TravlendarUserModelService
  ) {}

  // Initiate Google OAuth
  initOauth(isLocalStorage = false): void {
    if (isLocalStorage) {
      this.getUserIdFromStorage();
      return;
    }//
    this.authorized = false;
    this.authChanged.next(this.authorized);
    this.subscriber = this.userModel.userDataChanged
      .subscribe (data => {
        this.userData = data;
      });
    // this.headers = new HttpHeaders({'Content-Type': 'application/json'});
    this.oauthLinkRequest();
  }

  // Request the link for the google oauth page from the server.
  private oauthLinkRequest(): Subscription {
    return this.http.get(`${URL}/oauth`)
      .subscribe(
        data => this.oauthReroute(data['message']),
        err => {
          TravlendarUtils.log(`Error 500: ${err}`, this);
          this.authorized = false;
          this.authChanged.next(this.authorized);
        }
      );
  }

  //Reroute the user to the google login page.
  private oauthReroute(urlStr: string): void {
    const win = window.open(urlStr, '_blank', 'location=yes');

    let count = 0;
    const loginInterval = setInterval(() => {
      if (win.location.href.toString().startsWith(REDIRECT)) {
        const authURL = win.location.href.split('code=')[1];
        win.close();
        clearInterval(loginInterval);
        this.sendCode(authURL);
      }

      if (++count > 1500) { // taking over 5 minutes to log in
        win.close();
        clearInterval(loginInterval);
      }
    }, 200);
  }

  // Basic rerouting
  reroute(route: string): void {
    this.router.navigate([route]);
  }

  // Send the Authorization code to the server.
  private sendCode(code: string): Subscription {
    return this.http.get(`${URL}/oauth?code=${code}`)
      .subscribe(
        data => {
          if (data['message'] && data['message'].termsOfService) {
            let route = '/calendar';
            delete data['message']['hasSettings'];
            this.userModel.setCurrentUser(data['message'], data['message'].termsOfService);
            this.authorized = true;
            this.reroute((isNullOrUndefined(this.loginRouteState)) ? route : this.loginRouteState);
          } else {
            this.userModel.setCurrentUser(data['message'], false);
            this.authorized = false;
          }
          this.authChanged.next(this.authorized);
        },
        err => {
          TravlendarUtils.log(`Error Occurred: ${err}`, this);
          this.authorized = false;
          this.authChanged.next(this.authorized);
        }
      );
  }

  // Returns if the user is authorized.
  isAuthenticated() {
    return this.authorized;
  }

  // Logout perform all steps to log out the user.
  logOut(error) {
    let payload = {userid: JSON.parse(sessionStorage.getItem("user"))["_id"]};
    this.http.put (`${URL}/oauth/logout`, payload)
      .subscribe(
        data => {
          sessionStorage.removeItem('travlendarToken');
          this.userModel.removeSessionStorage('user');
          this.authorized = false;
          this.authChanged.next(this.authorized);
          this.loginRouteState = null;

          // Because Chrome caches pages, the css does not reload properly. Forcing the need to reload the page.
          if(navigator.userAgent.indexOf('Chrome') !== -1){
            window.location.href =
              (environment.production ? 'https://travlendar.me/' : 'http://localhost:4200/') + 'home';
          } else{
            this.reroute('/home');
          }
        }, err => {
          TravlendarUtils.log('Error 500:', this);
          TravlendarUtils.log(err);
        }
      );
  }

  termsOfServiceAccepted(): void {
    // Create the user
    this.userData['termsOfService'] = true;

    this.http.post(`${URL}/api/user`, this.userData)
      .subscribe(
        data => {
          this.authorized = true;
          this.authChanged.next(this.authorized);
          this.userModel.setCurrentUser(data['message'], data['message']['termsOfService']);

          this.reroute('/settings');
        }, err => {
          this.logOut('500');
        }
      );
  }

  // Update the route to take during login, to make it more reactive when logging in.
  updateLoginRouteState(state:string): void {
    this.loginRouteState = state;
  }

  // get Token, this will check the user auth token to make sure it is still valid, if so return the token
  // if not then it will request a new token prior to returning.
  private getToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      resolve('token');
    });
  }

  private getUserIdFromStorage() {
    let uid = JSON.parse(sessionStorage.getItem('user'))['_id'];

    return this.http.get(`${URL}/api/user/${uid}`, {headers: TravlendarUtils.getHeaders()})
      .subscribe(data => {
          if (data['message'] && data['message'].termsOfService) {
            this.userModel.setCurrentUser(data['message'], data['message'].termsOfService);
            this.authorized = true;
          } else {
            this.authorized = false;
          }
          this.authChanged.next(this.authorized);
        },
        err => {
          this.authorized = false;
          this.authChanged.next(this.authorized);
        }
      );
  }
}
