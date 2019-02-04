////////////////////////////////////////////////////////////////////////////////////
//                              Login Component                                   //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Component to display the login page.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Oct 30, 2017         Jason Rice          Created File (ts, html, css)
 *   Nov 3, 2017          Jason Rice          Updated checkParms and getTermsRoute functions L45-65.
 *   Nov 19, 2017         Cephas Mensah       Using Subsriptions
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import { TravlendarAuthorizationService } from '../travlendar-authorization.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {TravlendarUserModelService} from '../../shared/datamodel/travlendar-user-model.service';
import {TravlendarUtils} from '../../shared/travlendar-utils';

declare var jQuery: any;

@Component({
  selector: 'travlendar-login',
  templateUrl: './travlendar-login.component.html',
  styleUrls: ['./travlendar-login.component.css', '../../shared/travlendar-shared.styles.css']
})

export class TravlendarLoginComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  notLogin: boolean = true;
  private subscription: Subscription;
  private userSubscription: Subscription;

  constructor(
    private authService:TravlendarAuthorizationService,
    private activatedRoute:ActivatedRoute,
    private userService: TravlendarUserModelService,
    private router:Router) {}

  ngOnInit() {
    this.isLoading = false;
    this.subscription = this.authService.authChanged
      .subscribe((data: boolean) => {
        this.isLoading = !data;
      });

    this.userSubscription = this.userService.userDataChanged
      .subscribe((data: object) => {
        if (data && !data['termsOfService']) {
          this.notLogin = false;
          jQuery('#tosModal').modal('toggle');
        }
      });
  }

  //String for HTML injection.
  errorNotificationMsg:String = null;

  //Google button click action.
  signinClick() {
    this.isLoading = true;
    this.errorNotificationMsg = null;
    this.authService.initOauth(false);
  }

  tosAccepted (accepted: boolean) {
    TravlendarUtils.log('Accepted Again: ' + accepted, this);
    this.isLoading = false;
    this.notLogin = true;
    if (accepted) {
      this.authService.termsOfServiceAccepted();
    }
  }

  ngOnDestroy () {
    this.subscription.unsubscribe();
    this.userSubscription.unsubscribe();
  }
}
