////////////////////////////////////////////////////////////////////////////////////
//                              Header Component                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Header Component to the application pages.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Oct 30, 2017         Jason Rice          Created File (ts, html, css)
 *   Nov 16, 2017         Jason Rice          Added the logOut stuff to the Navbar
 *   Nov 19, 2017         Cephas Mensah       Using Subcription
 *
 */

import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import { TravlendarAuthorizationService } from "../travlendar-authorization.service";
import { Subscription } from 'rxjs/Subscription';
import {NavigationStart, Router} from '@angular/router';
import {TravlendarUserModelService} from '../../shared/datamodel/travlendar-user-model.service';

@Component({
  selector: 'travlendar-header',
  templateUrl: './travlendar-header.component.html',
  styleUrls: ['./travlendar-header.component.css']
})

export class TravlendarHeaderComponent implements OnDestroy, OnInit {
  isAuthorized: boolean = false;
  private subscription: Subscription;

  constructor(private authService: TravlendarAuthorizationService, private router: Router) {

  }

  ngOnInit() {
    this.isAuthorized = this.authService.isAuthenticated();
    this.subscription = this.authService.authChanged
      .subscribe((data: boolean) => {
        this.isAuthorized = data;
      });

    if (sessionStorage.getItem('auth') === 'true') {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
          if (event.url === '/calendar' || event.url === '/settings') {
            this.authService.initOauth(true);
            return;
          }
        }
      });
    }
  }

  logoutClicked(){
    this.authService.logOut(null);
  }

  routeToPage(route: String) {
    this.router.navigate([route]);
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
