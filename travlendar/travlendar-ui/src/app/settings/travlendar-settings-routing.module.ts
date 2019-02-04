////////////////////////////////////////////////////////////////////////////////////
//                         Settings Routing Module                                //
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
import { TravlendarSettingsComponent } from "./travlendar-settings.component";
import {TravlendarAuthGuard} from '../core/travlendar-authorization-guard.service';

//Routes
const travlendarSettingsRoutes:Routes = [
  {path: '', component: TravlendarSettingsComponent, canActivate: [TravlendarAuthGuard] }
];

@NgModule({
  imports:[RouterModule.forChild(travlendarSettingsRoutes)],
  exports:[RouterModule]
})

export class TravlendarSettingsRouterModule {}

