////////////////////////////////////////////////////////////////////////////////////
//                              App Module                                        //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Basic Angular required component for specification.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 12, 2017         Jason Rice          Changed Calendar, Settings components  out for modules.
 *   Nov 19, 2017         Cephas Mensah       Breaking Modules into smaller pieces
 *   Feb 21, 2017         Jason Rice          Moved the AGM import to shared folder to avoid warning of multiple loading.
 *   Feb 22, 2017         Jason Rice          Removed the AGM because since there was no current need for it.
 */

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

//Component Imports
import { AppComponent } from './app.component';

//Services Imports
import {TravlendarCoreModule} from './core/travlendar-core.module';
import {TravlendarRouterModule} from './travlendar-routing.module';
import {TravlendarAuthGuard} from './core/travlendar-authorization-guard.service';
import {TravlendarAuthorizationService} from './core/travlendar-authorization.service';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    TravlendarCoreModule,
    TravlendarRouterModule,
    BrowserAnimationsModule
  ],
  providers: [
    TravlendarAuthorizationService,
    TravlendarAuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
