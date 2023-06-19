import { Component } from '@angular/core';
import { CompService } from '../comp.service';
import { HttpClient } from '@angular/common/http';
import { SettingService } from '../setting.service';
export const CHroles : string[] = ["Pc", "m1", "m2", "l1", "l2", "pI", "pQ", "rI", "rQ", "pitot", "×"];
@Component({
  selector: 'app-prepare',
  templateUrl: './prepare.component.html',
  styleUrls: ['./prepare.component.css']
})
export class PrepareComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];
  GasName : string[] = ["Air", "N2", "He", "×"];
  bindGas = ["Air", "He", "Air", "Air"];
  diaphragm = "spcc"
  CHroles = CHroles;
  binds : {name: string, role:string}[]= [
    {name: "CH1-1[V]", role :"Pc"},   {name: "CH1-2[V]", role :"×"},
    {name: "CH2-1[V]", role :"m1"},   {name: "CH2-2[V]", role :"×"},
    {name: "CH3-1[V]", role :"m2"},   {name: "CH3-2[V]", role :"×"},
    {name: "CH4-1[V]", role :"l1"},   {name: "CH4-2[V]", role :"×"},
    {name: "CH5-1[V]", role :"l2"},   {name: "CH5-2[V]", role :"×"},
    {name: "CH6-1[V]", role :"pI"},   {name: "CH6-2[V]", role :"pQ"},
    {name: "CH7-1[V]", role :"rI"},   {name: "CH7-2[V]", role :"rQ"},
    {name: "CH8-1[V]", role :"pitot"},   {name: "CH8-2[V]", role :"×"},
  ]
  public data : {[key : string]: {value: number, unit : string}} = {};
  armed = false;

  constructor(public compService: CompService, private http : HttpClient, private settingSerive: SettingService){
    this.data['PR0'] = {value : 1, unit : "MPa"};
    this.data['PC0'] = {value : 101.3, unit : "kPa"};
    this.data['PM0'] = {value : 1, unit : "kPa"};
    this.data['PL0'] = {value : 100, unit : "Pa"};
    this.data['Dth'] = {value : 15, unit : "mm"};
    this.data['groove'] = {value : 1, unit : "mm"};
    this.data['td2'] = {value : 12, unit : "μm"};
    this.data['T0'] = {value : 297, unit : "K"};
    this.data['Wp'] = {value : 0.28, unit : "kg"};
  }
  onSelectedChanged() {
  }
  onSaveClick(){}
  onButtonClick(name : string){
    switch(name){
      case "arm":
        this.http.post("/buttonClicked", { message : "arm"}, {headers: { 'Content-Type' : 'application/json' }}).subscribe(response => {
          console.log(response)
          if(response == "OK"){
            this.armed = true
          }
        });
        break;
      case "fire":
        this.http.post("/buttonClicked", { message : "fire"}, {headers: { 'Content-Type' : 'application/json' }}).subscribe(response => {
          console.log(response)
          this.armed = false;
        });
        break;
    }
  }
}
