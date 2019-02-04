///<reference path="travlendar-not-found.component.ts"/>
import { NgModule } from '@angular/core';

import {TravlendarHeaderComponent} from './header/travlendar-header.component';
import {TravlendarLoginComponent} from './login/travlendar-login.component';
import {TravlendarPageNotFoundComponent} from './travlendar-not-found.component';
import {TravlendarRouterModule} from '../travlendar-routing.module';
import {TravlendarTOSModalComponent} from './login/tos-modal/travlendar-tos-modal.component';
import { TravlendarFooterComponent } from './footer/travlendar-footer.component';
import {TravlendarSharedModule} from "../shared/travlendar-shared.module";

@NgModule({
  declarations: [
    TravlendarHeaderComponent,
    TravlendarFooterComponent,
    TravlendarLoginComponent,
    TravlendarPageNotFoundComponent,
    TravlendarTOSModalComponent
  ],
  imports: [
    TravlendarRouterModule,
    TravlendarSharedModule.forRoot()
  ],
  exports: [
    TravlendarHeaderComponent,
    TravlendarLoginComponent,
    TravlendarFooterComponent,
    TravlendarPageNotFoundComponent,
    TravlendarSharedModule,
    TravlendarTOSModalComponent
  ]
})
export class TravlendarCoreModule {}
