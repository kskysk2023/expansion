import { Component } from '@angular/core';
import { Bind } from '../setting/setting.component';
import { CompService } from '../comp.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-prepare',
  templateUrl: './prepare.component.html',
  styleUrls: ['./prepare.component.css']
})
export class PrepareComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];
  GasName : string[] = ["Air", "N2", "He", "×"];
  bindGas = ["Air", "He", "Air", "Air"];
  diaphragm = ""
  bind :Bind = {
    compression: "CH1-1[V]",
    shock :{m1: "×", m2: "×", l1: "×", l2: "×"},
    piston : {I: "×", Q: "×"},
    rupture : {I: "×", Q: "×"}
  }
  constructor(public compService: CompService, private http : HttpClient){}
  onSelectedChanged() {
    const compression = this.bind.compression;
    const shock = Object.values(this.bind.shock).filter(value => value && value !== "×");
    const rupture = Object.values(this.bind.rupture).filter(value => value && value !== "×");
    const piston = Object.values(this.bind.piston).filter(value => value && value !== "×");
  }

  onButtonClick(name : string){
    switch(name){
      case "arm":
        this.http.post("/buttonClicked", { message : "arm"}, {headers: { 'Content-Type' : 'application/json' }}).subscribe(response => {
          console.log(response)
        });
        break;
      case "fire":
        this.http.post("/buttonClicked", { message : "fire"}, {headers: { 'Content-Type' : 'application/json' }}).subscribe(response => {
          console.log(response)
        });
        break;
    }
  }
}
