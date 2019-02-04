import {CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {Injectable } from '@angular/core';
import {Subscription} from 'rxjs/Subscription';
import {TravlendarAuthorizationService} from './travlendar-authorization.service';
import {TravlendarUtils} from '../shared/travlendar-utils';

@Injectable()
export class TravlendarAuthGuard implements CanActivate {
  subscriber: Subscription;
  auth: boolean;

  constructor(private authService: TravlendarAuthorizationService, private router: Router) {
    this.auth = this.authService.isAuthenticated();
    this.subscriber = this.authService.authChanged
      .subscribe(data => {
        TravlendarUtils.log("Auth Changed", this);
        TravlendarUtils.log(data, this);
        this.auth = data;
      });
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    TravlendarUtils.log('Auth data: ' + this.auth, this);
    TravlendarUtils.log('State: ' + state.url, this);
    if (!this.auth){
      this.authService.updateLoginRouteState(state.url);
      this.router.navigate(['/home'], {
        queryParams: {
          return: 'user not authorized' + state.url
        }
      });
    }
    return this.auth;
  }
}
