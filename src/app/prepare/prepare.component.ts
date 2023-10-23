import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SettingService } from '../setting.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { CHroles, GasName, getPistonMat, mats } from '../funcs';

@Component({
  selector: 'app-prepare',
  templateUrl: './prepare.component.html',
  styleUrls: ['./prepare.component.css']
})
export class PrepareComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];
  GasName = GasName;
  bindGas = ["Air", "He", "Air", "Air"];
  matds = mats;
  CHroles = CHroles;
  selectedDate : Date | null= null;
  time = "";
  shotNum = 0;
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

  constructor(private http : HttpClient, private settingSerive: SettingService){
    this.data['PR0'] = {value : 1, unit : "MPa"};
    this.data['PC0'] = {value : 101.3, unit : "kPa"};
    this.data['PM0'] = {value : 1, unit : "kPa"};
    this.data['PL0'] = {value : 100, unit : "Pa"};
    this.data['Dth'] = {value : 15, unit : "mm"};
    this.data['groove'] = {value : 1, unit : "mm"};
    this.data['td2'] = {value : 12, unit : "μm"};
    this.data['T0'] = {value : 297, unit : "K"};
    this.data['Wp'] = {value : 0.28, unit : "kg"};
    this.data['matd1'] = {value: 0, unit : "-"};
  }
  onSelectedChanged() {

  }
  onDateChange(event : MatDatepickerInputEvent<Date>){
    this.selectedDate = event.value; // This is the selected date
  }

  onSaveClick(){
    console.log(this.selectedDate, this.time);
    this.selectedDate?.setHours(Number(this.time.slice(0, 2)), Number(this.time.slice(3, this.time.length)));
    console.log(this.time.slice(3, this.time.length))
    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1;  // JavaScriptの月は0から始まるため1を加える
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    // 数値が1桁だった場合に0を先頭に付加するための関数
    function pad(n: number): string {
      return n < 10 ? '0' + n : n.toString();
    }

    let formattedDate = `${year}_${pad(month)}_${pad(day)}_${pad(hours)}_${pad(minutes)}`;
    console.log(formattedDate);  // "2023_06_18_10_30" のように表示
    let out : (number | string)[] = [
      this.shotNum, formattedDate,
      "", "", "",
      mats[this.data["matd1"].value], this.data["Dth"].value, getPistonMat(this.data["Wp"].value), this.data["td2"].value,
      this.data["groove"].value, ...this.bindGas, this.data['PR0'].value, this.data['PC0'].value, this.data['PM0'].value, this.data['PL0'].value,
    ];
  }

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
