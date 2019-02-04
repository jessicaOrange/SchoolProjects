import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {TravlendarSettingsService} from "../settings/travlendar-settings.service";
import {TravlendarSocketService} from "./travlendar-shared.socket.service";
import {TravlendarUserModelService} from "./datamodel/travlendar-user-model.service";
import {ModuleWithProviders} from "@angular/compiler/src/core";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ]
})
export class TravlendarSharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: TravlendarSharedModule,
      providers: [
        TravlendarUserModelService,
        TravlendarSettingsService,
        TravlendarSocketService
      ]
    };
  }
}
