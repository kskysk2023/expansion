import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SettingService } from '../setting.service';
import { getKappaM, getNameFromM } from '../funcs';
import { Comp } from '../comp';

@Component({
  selector: 'app-comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.css'],
})
export class CompComponent implements AfterViewInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  GasName : string[] = ["Air", "N2", "He", "×"];
  bindGas = ["Air", "He", "Air", "Air"];
  matd1s = ['Al','spcc', 'PLA', 'ABS'];
  diaphragm = ""
  comp: Comp;

  constructor(public settingService: SettingService){
    this.comp = this.settingService.comp;
  }
  ngAfterViewInit(){ 
    this.settingService.getEvent().subscribe((value) => {
      if(value == "setBindGas"){
        this.bindGas[0] = getNameFromM(this.comp.data["MR"].value)
        this.bindGas[1] = getNameFromM(this.comp.data["MC"].value)
        this.bindGas[2] = getNameFromM(this.comp.data["MM"].value)
        this.bindGas[3] = getNameFromM(this.comp.data["ML"].value)
      }
      this.diaphragm = this.matd1s[this.comp.data["matd1"].value];
    })
  }
  onSelectedChanged(){
    this.comp.data["MR"] = {value: getKappaM(this.bindGas[0]).M, unit : "-"};
    this.comp.data["MC"] = {value: getKappaM(this.bindGas[1]).M, unit : "-"};
    this.comp.data["MM"] = {value: getKappaM(this.bindGas[2]).M, unit : "-"};
    this.comp.data["ML"] = {value: getKappaM(this.bindGas[3]).M, unit : "-"};
  
    this.comp.data["kR"] = {value: getKappaM(this.bindGas[0]).kappa, unit : "-"};
    this.comp.data["kC"] = {value: getKappaM(this.bindGas[1]).kappa, unit : "-"};
    this.comp.data["kM"] = {value: getKappaM(this.bindGas[2]).kappa, unit : "-"};
    this.comp.data["kL"] = {value: getKappaM(this.bindGas[3]).kappa, unit : "-"};
  
    this.comp.data["matd1"] = {value: this.settingService.mats.indexOf(this.diaphragm), unit : "-"};
    this.comp.calc()
  }
}
