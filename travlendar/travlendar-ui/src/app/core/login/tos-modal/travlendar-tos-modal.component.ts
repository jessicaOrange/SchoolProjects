import {Component, EventEmitter, OnInit, Output, Input} from '@angular/core';
import {TravlendarUtils} from '../../../shared/travlendar-utils';

declare var jQuery: any;

@Component({
  selector: 'app-tos-modal',
  templateUrl: './travlendar-tos-modal.component.html',
  styleUrls: ['./travlendar-tos-modal.component.css','../../../shared/travlendar-shared.styles.css']
})
export class TravlendarTOSModalComponent implements OnInit {

  @Input() notLogin;
  @Output () isAccepted = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }

  //Terms accepted so call the method to update the server.
  termsAccept(accepted: boolean): void{
    TravlendarUtils.log("TOS AGREED: " + accepted, this);
    this.isAccepted.emit(accepted);

    jQuery('#tosModal').modal('toggle');
  }

  toggleModal(){
    jQuery('#tosModal').modal('toggle');
  }

}
