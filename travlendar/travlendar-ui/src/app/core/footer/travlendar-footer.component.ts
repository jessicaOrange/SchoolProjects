////////////////////////////////////////////////////////////////////////////////////
//                              Footer Component                                  //
////////////////////////////////////////////////////////////////////////////////////
/*
 * Description: Footer Component to the application pages.
 *
 * Change Log:
 *   DATE                 NAME                DESCRIPTION OF CHANGE
 *   Nov 28, 2017         David Henderson     Created File (ts, html, css)
 *
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
declare var jQuery:any;
@Component({
  selector: 'travlendar-footer',
  templateUrl: './travlendar-footer.component.html',
  styleUrls: ['./travlendar-footer.component.css']
})

export class TravlendarFooterComponent {
  toggleTOS(){
    jQuery('#tosModal').modal('toggle');
  }
}
