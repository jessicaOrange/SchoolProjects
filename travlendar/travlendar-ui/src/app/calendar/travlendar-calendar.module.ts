////////////////////////////////////////////////////////////////////////////////////
//                              Calendar Module                                   //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Calendar module to group the components dealing with the calendar.
 * Notes:
 *    declarations: Any component used must be added to declarations and exported
 *      through this module.
 *    imports: CommonModule must be included for lazy loading.
 *      Any routing for different components must also be added as an import.
 *    providers: Any services used by the component must be included in the services for this module.
 *
 *    References:
 *      AgmCoreModule import: http://brianflove.com/2016/10/18/angular-2-google-maps-places-autocomplete/
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 12, 2017         Jason Rice          Created File.
 *   Nov 19, 2017         Cephas Mensah       Removing circular references
 *   Feb 10, 2017         Jason Rice          Added import for AGM.
 *   Feb 21, 2017         Jason Rice          Removed the previously added import.
 */

//Imports
import { NgModule } from "@angular/core";
import { CalendarModule } from 'angular-calendar';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgbModalModule} from '@ng-bootstrap/ng-bootstrap';

//Components
import { TravlendarCalendarComponent } from "./travlendar-calendar.component";
import {TravlendarSharedModule} from '../shared/travlendar-shared.module';
import {TravlendarCalendarService} from './travlendar-calendar.service';
import {MyCalendarMonthViewComponent} from "./calendar-view-overrider/my-calendar-month-view.component";

//Routing
import {TravlendarCalendarRouterModule} from './travlendar-calendar-routing.module';
import {TravlendarEventModalComponent} from "./event/travlendar-event-modal/travlendar-event-modal.component";
import {TravlendarTravelModalComponent} from "./travel/travlendar-travel-modal/travlendar-travel-modal.component";
import {TravlendarEventService} from './event/travlendar-event.service';
import {TravlendarTravelEventService} from "./travel/travlendar-travel.service";

@NgModule({
  declarations: [
    TravlendarCalendarComponent,
    TravlendarEventModalComponent,
    MyCalendarMonthViewComponent,
    TravlendarTravelModalComponent
  ],
  imports: [
    CalendarModule.forRoot(),
    NgbModule.forRoot(),
    NgbModalModule.forRoot(),
    TravlendarSharedModule,
    TravlendarCalendarRouterModule
  ],
  exports: [
    TravlendarCalendarComponent
  ],
  providers: [
    TravlendarCalendarService,
    TravlendarEventService,
    TravlendarTravelEventService
  ]
})
export class TravlendarCalendarModule {}
