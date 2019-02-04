import {Component, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {NgForm} from '@angular/forms';
import {TravlendarUserModelService} from '../shared/datamodel/travlendar-user-model.service';
import {Subscription} from 'rxjs/Subscription';
import {TravlendarSettingsService} from './travlendar-settings.service';
import {TravlendarUtils} from '../shared/travlendar-utils';
import {Router} from '@angular/router';
import {TravlendarAuthorizationService} from '../core/travlendar-authorization.service';
import {} from 'googlemaps';
import {isNullOrUndefined} from "util";

import { environment } from '../../environments/environment';
const CALENDAR = environment.production ?  'Travlendar Calendar' : 'Travlendar Calendar (dev)';

@Component({
  selector: 'settings',
  templateUrl: './travlendar-settings.component.html',
  styleUrls: ['./travlendar-settings.component.css', '../shared/travlendar-shared.styles.css']
})

export class TravlendarSettingsComponent implements OnInit, OnDestroy {
  transportationMode = [
    {name: 'Driving', selected: false},
    {name: 'Bicycling', selected: false},
    {name: 'Transit', selected: false},
    {name: 'Walking', selected: false},
  ];
  preferredTransitModes = ['Bus', 'Rail', 'Subway', 'Train', 'Tram'];
  preferredTransitOptions = [];

  calendarView = ['Select Default Calendar View', 'Day', 'Week', 'Month'];

  selectedTransportation = [];
  selectedCalendarView = '';
  address='';

  cloneCalendars: Array<String> = [];
  gCalendars: Array<String> = [];

  gCalSelected;
  cloneSelected;

  model = {
    city: '',
    state: '',
    zipCode: '',
    street: '',
    country: '',
    lat: -1,
    lon: -1
  };

  @ViewChild('gaddress') googleAddress: ElementRef;

  private userData: object;
  private subscribeUser: Subscription;

  constructor(private userModel: TravlendarUserModelService,
              private settings: TravlendarSettingsService,
              private authService: TravlendarAuthorizationService,
              private router: Router
  ) {}

  ngOnInit() {
    let gmpAutocomplete = new google.maps.places.Autocomplete(this.googleAddress.nativeElement);
    gmpAutocomplete.addListener('place_changed', () => {
      let sAddress = gmpAutocomplete.getPlace();
      if(!isNullOrUndefined(sAddress)) {
        try{
          let addressElements = sAddress.formatted_address.split(',');
          this.address = sAddress.formatted_address;
          this.model.street = addressElements[0]? addressElements[0].trim() : '';
          this.model.city = addressElements[1]? addressElements[1].trim() : '';
          let stateZip = addressElements[2].split(' ');
          this.model.state = stateZip[1]? stateZip[1].trim() : '';
          this.model.zipCode = stateZip[2]? stateZip[2].trim() : '';
          this.model.country = addressElements[3]? addressElements[3].trim() : '';
          this.model.lat = (sAddress.geometry.location.lat())? sAddress.geometry.location.lat() : -1;
          this.model.lon = (sAddress.geometry.location.lng())? sAddress.geometry.location.lng() : -1;
        } catch(Exception){
          TravlendarUtils.log('Exception occurred: '+ Exception.message, this);
        }
      }
    });

    this.selectedCalendarView = this.calendarView[0];
    this.userData = this.userModel.getUserData();

    this.subscribeUser = this.userModel.userDataChanged
      .subscribe((data: object) => {
        if (data && data['settings']) {
          this.userData = data;
          let settings = this.userData['settings'];
          if (settings['cloneCalendar']) this.cloneCalendars = settings ['cloneCalendar'];
          if (settings['defaultCalView']) this.selectedCalendarView = settings ['defaultCalView'];
          if (settings['startAddress']){
            this.model = settings ['startAddress'];
            TravlendarUtils.log('Address Object Returned ' + JSON.stringify(settings.startAddress), this);
            if(!this.model.country) this.model.country = 'US';
            this.address = this.model.street + ', ' + this.model.city + ', '
              + this.model.state + ', ' + this.model.country;
            this.googleAddress.nativeElement.value = this.address;
          }
          if (settings['modeOfTravel']) {
            this.selectedTransportation = settings ['modeOfTravel'];
            for(let transportMethod = 0; transportMethod < this.transportationMode.length; transportMethod++){
              this.transportationMode[transportMethod].selected = false;
            }
            this.transportationMode.map ((item) => {
              this.selectedTransportation.forEach ((x) => {
                if (x === item['name']) item.selected = true;
              });
            });
          }
          if(settings.preferredTransitModes){
            for(let preferredName of settings.preferredTransitModes){
              this.preferredTransitOptions.push(preferredName);
            }
          }

          this.gCalendars = this.arrayDiff(this.gCalendars, this.cloneCalendars);
        }
      });

    this.settings.readUserSettings(this.userData['_id'], (err, gCals) => {
      if (err) {
        if (err['status'] === 401) return this.authService.logOut(err);

        this.gCalendars = [];

        return;
      }

      this.gCalendars = gCals;

      if (this.cloneCalendars.length === 0) {
        this.gCalendars.forEach(item => {
          if (item['gCal_summary'].endsWith(CALENDAR)) {
            this.cloneCalendars.push(item);
          }
        });
      }

      this.gCalendars = this.arrayDiff(this.gCalendars, this.cloneCalendars);
    });
  }

  setSelectedTransport (item: string, checked: boolean){
    if (checked) {
      if (this.selectedTransportation.indexOf(item) === -1) {
        this.selectedTransportation.push(item);
      };
    } else {
      this.selectedTransportation = this.selectedTransportation.slice().filter(data => {
        return item != data;
      });
    }
  }

  cancelClicked() {
    this.router.navigate(['/calendar']);
  }

  saveClicked(form: NgForm) {
    if (this.calendarView.indexOf(form.value.calendar) < 1)
      form.value.calendar = null;

    let userSettings = {
      'defaultCalView': form.value.calendar,
      'modeOfTravel': this.selectedTransportation,
      'preferredTransitModes': (this.selectedTransportation.indexOf('Transit') !== -1)?
        this.preferredTransitOptions: undefined,
      'cloneCalendar': this.cloneCalendars,
      'startAddress': {
        'street': this.model.street,
        'city': this.model.city,
        'state': this.model.state,
        'zipCode': this.model.zipCode,
        'country': this.model.country,
        'lat': this.model.lat,
        'lon': this.model.lon
      }
    };


    // if (this.auth) this.userModel.setCurrentUserSettings(userSettings);
    if (this.userData['settings']) {
      this.settings.updateUserSettings(this.userData['_id'], userSettings, this.settingsSaved);
    } else {
      this.settings.createUserSettings(this.userData['_id'], userSettings, this.settingsSaved);
    }

    this.preferredTransitOptions = [];
  }

  moveAllAsSelected(){
    this.cloneCalendars.push(...this.gCalendars.slice());
    this.gCalendars.length = 0;
  }

  moveAllAsUnSelected(){
    this.gCalendars.push(...this.cloneCalendars.slice());
    this.cloneCalendars.length = 0;
  }

  moveToClone() {
    this.cloneCalendars.push(...this.gCalSelected.slice());
    this.gCalendars = this.arrayDiff(this.gCalendars, this.gCalSelected);

    this.cloneSelected = null;
    this.gCalSelected = null;
  }

  moveFromClone() {
    this.gCalendars.push(...this.cloneSelected.slice());
    this.cloneCalendars = this.arrayDiff(this.cloneCalendars, this.cloneSelected);

    this.cloneSelected = null;
    this.gCalSelected = null;
  }

  private arrayDiff (arr1: Array<any>, arr2: Array<any>) {
    arr2.forEach (item => {
      arr1.filter(x => {
        if (item['gCal_id'] === x['gCal_id']) {
          arr1.splice(arr1.indexOf(x), 1);
        }
      });
    });
    return arr1;
  }

  private settingsSaved = ((err, isSaved) => {
    if (isSaved) {
      this.router.navigate(['/calendar']);
    }
  });

  hasTransitModeChecked(transitOption){
    return this.preferredTransitOptions.indexOf(transitOption) !== -1;
  }

  setPreferredTransitMode(transitOption, event){
    let index = this.preferredTransitOptions.indexOf(transitOption);
    if(event.target.checked){
      if(index === -1)
        this.preferredTransitOptions.push(transitOption);
    }else{
      if(index !== -1){
        this.preferredTransitOptions.splice(index, 1);
      }
    }
  }

  ngOnDestroy(){
    this.subscribeUser.unsubscribe();
  }
}
