////////////////////////////////////////////////////////////////////////////////////
//                              Settings Module                                   //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: module to group the components for the settings page.
 * Notes:
 *    declarations: Any component used must be added to declarations and exported
 *      through this module.
 *    imports: CommonModule must be included for lazy loading.
 *      Any routing for different components must also be added as an import.
 *    providers: Any services used by the component must be included in the services for this module.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 12, 2017         Jason Rice          Created File.
 *   Nov 19, 2017         Cephas Mensah       Removing circular references
 *   Feb 13, 2017         Jason Rice          Added library for address auto-complete.
 *   Feb 21, 2017         Jason Rice          Removed the previously added library.
 */

//Imports
import { NgModule } from "@angular/core";
import {TravlendarSharedModule} from '../shared/travlendar-shared.module';

//Component
import { TravlendarSettingsComponent } from "./travlendar-settings.component";

//Routing
import { TravlendarSettingsRouterModule } from "./travlendar-settings-routing.module";

@NgModule({
  declarations: [
    TravlendarSettingsComponent
  ],
  imports: [
    TravlendarSharedModule,
    TravlendarSettingsRouterModule,
  ]
})
export class TravlendarSettingsModule { }
