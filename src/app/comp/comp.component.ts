import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CompService, getKappaM, getNameFromM } from '../comp.service';
import { SettingService } from '../setting.service';

@Component({
  selector: 'app-comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.css'],
})
export class CompComponent implements AfterViewInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  GasName : string[] = ["Air", "N2", "He", "×"];
  bindGas = ["Air", "He", "Air", "Air"];
  diaphragm = ""
  constructor(public compService : CompService, public settingService: SettingService){}
  ngAfterViewInit(){ 
    this.compService.getEvent().subscribe((value) => {
      if(value == "setBindGas"){
        this.bindGas[0] = getNameFromM(this.compService.data["MR"].value)
        this.bindGas[1] = getNameFromM(this.compService.data["MC"].value)
        this.bindGas[2] = getNameFromM(this.compService.data["MM"].value)
        this.bindGas[3] = getNameFromM(this.compService.data["ML"].value)
      }
    })
  }
  onSelectedChanged(){
    this.compService.data["MR"] = {value: getKappaM(this.bindGas[0]).M, unit : "-"};
    this.compService.data["MC"] = {value: getKappaM(this.bindGas[1]).M, unit : "-"};
    this.compService.data["MM"] = {value: getKappaM(this.bindGas[2]).M, unit : "-"};
    this.compService.data["ML"] = {value: getKappaM(this.bindGas[3]).M, unit : "-"};
  
    this.compService.data["kR"] = {value: getKappaM(this.bindGas[0]).kappa, unit : "-"};
    this.compService.data["kC"] = {value: getKappaM(this.bindGas[1]).kappa, unit : "-"};
    this.compService.data["kM"] = {value: getKappaM(this.bindGas[2]).kappa, unit : "-"};
    this.compService.data["kL"] = {value: getKappaM(this.bindGas[3]).kappa, unit : "-"};
  
    this.compService.data["matd1"] = {value: this.settingService.mats.indexOf(this.diaphragm), unit : "-"};
    this.compService.calc()
  }
}
