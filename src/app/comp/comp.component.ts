import { Component, OnInit } from '@angular/core';
import { CompService } from '../comp.service';
import { MatInputModule } from '@angular/material/input';
export interface Bind {
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
}
@Component({
  selector: 'app-comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.css'],
})
export class CompComponent implements OnInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  Gas : string[] = ["Air", "N2", "He"];
  bind :Bind = {R: {g: "Air", P:1}, C:{g:"He", P:101.3}, M:{g:"Air", P:1}, L:{g:"Air", P:100}, Dth:15, T0 : 300, Wp:0.28};

  constructor(public compService : CompService){}
  ngOnInit(){
    this.onSelectedChanged();
  }
  onSelectedChanged(){
    this.compService.setCondition(this.bind);
  }
}
