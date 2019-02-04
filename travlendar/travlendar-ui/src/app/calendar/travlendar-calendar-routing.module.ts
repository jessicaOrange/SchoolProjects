////////////////////////////////////////////////////////////////////////////////////
//                         Calendar Routing Module                                //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Separation of routing for implementation of lazy loading.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 12, 2017         Jason Rice          Created File.
 */

//Imports
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from "@angular/core";

//Components
import { TravlendarCalendarComponent } from "./travlendar-calendar.component";
import {TravlendarAuthGuard} from '../core/travlendar-authorization-guard.service';

//Routes
const travlendarCalendarRoutes:Routes = [
  {path: '', component: TravlendarCalendarComponent, canActivate: [TravlendarAuthGuard] }
];

@NgModule({
  imports:[RouterModule.forChild(travlendarCalendarRoutes)],
  exports:[RouterModule]
})

export class TravlendarCalendarRouterModule {}

