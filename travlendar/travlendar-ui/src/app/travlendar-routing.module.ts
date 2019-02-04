////////////////////////////////////////////////////////////////////////////////////
//                              Routing Component                                 //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Abstraction of the Routing from app.module.ts.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 01, 2017         Jason Rice          Created File.
 *   Nov 12, 2017         Jason Rice          Implemented lazy loading.
 *   Nov 19, 2017         Cephas Mensah       Restructuring Routing
 */

//imports
import { NgModule } from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';

//route components
import { TravlendarPageNotFoundComponent } from './core/travlendar-not-found.component';
import { TravlendarLoginComponent } from "./core/login/travlendar-login.component";

//routes
const travlendar_routes:Routes = [
  {path: '', redirectTo: '/home', pathMatch: 'full'},
  {path: 'home', component: TravlendarLoginComponent},
  {path: 'oauth', component: TravlendarLoginComponent},
  {path: 'calendar', loadChildren: './calendar/travlendar-calendar.module#TravlendarCalendarModule'},
  {path: 'settings', loadChildren: './settings/travlendar-settings.module#TravlendarSettingsModule'},
  {path: '**', component: TravlendarPageNotFoundComponent}
];

@NgModule({
  imports:[
    RouterModule.forRoot(travlendar_routes, {preloadingStrategy: PreloadAllModules})//, enableTracing: true})// , useHash: true})
  ],
  exports:[RouterModule]
})

export class TravlendarRouterModule {}
