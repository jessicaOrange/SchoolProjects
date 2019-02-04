import {
  Component, ViewEncapsulation, Input, Output, EventEmitter, AfterContentChecked, OnInit, ViewChild,
  ElementRef, OnDestroy, AfterContentInit, AfterViewInit, OnChanges
} from '@angular/core';
import {TravlendarUtils} from '../../../shared/travlendar-utils';
import {NgForm} from '@angular/forms';
import {isNullOrUndefined} from 'util';
import {} from 'googlemaps';
import { RRule, RRuleSet, Options } from 'rrule';
import { Weekday } from 'rrule';

declare function require(name:string); var rrulestr = require('rrule').rrulestr;
declare var jQuery:any;

const MINUTES = 30 * 60 * 1000;
const ROUND_MINUTES = 30;

@Component({
  selector: 'app-travlendar-travel-modal',
  templateUrl: './travlendar-travel-modal.component.html',
  styleUrls: ['./travlendar-travel-modal.component.css', '../../../shared/travlendar-shared.styles.css'],
  encapsulation: ViewEncapsulation.None
})

export class TravlendarTravelModalComponent {

  @Input() travelEventData;
}
