import { Component } from '@angular/core';
export interface rowData {
  name : string;
  value : number;
  unit : string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent {
  constructor(){ }
}
