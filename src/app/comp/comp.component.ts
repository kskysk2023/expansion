import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CompService } from '../comp.service';
import { SettingService } from '../setting.service';
export interface Gass {
  R: {
      g: string;
      P: number;
  };
  C: {
      g: string;
      P: number;
  };
  M: {
      g: string;
      P: number;
  };
  L: {
      g: string;
      P: number;
  };
  Dth: number;
  T0:number;
  Wp:number;
  groove:number;
}

@Component({
  selector: 'app-comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.css'],
})
export class CompComponent implements AfterViewInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  Gas : string[] = ["Air", "N2", "He"];

  constructor(public compService : CompService, public settingService: SettingService){}
  ngAfterViewInit(){ 
  }
  onSelectedChanged(){
    this.compService.setCondition()
  }
}
