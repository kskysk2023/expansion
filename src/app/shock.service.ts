import { Injectable } from '@angular/core';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';
import { rowData } from './app.component';

@Injectable({
  providedIn: 'root'
})
export class ShockService {
  senkeiKinji(x1: number, x2: number, y1: number, y2: number, x: number): number {
    const y = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
    console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
    return y;
  }
  
  senkeiKinjix(x1: number, x2: number, y1: number, y2: number, y: number): number {
    const x = ((x2 - x1) / (y2 - y1)) * (y - y1) + x1;
    console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
    return x;
  }
  public P: dfd.DataFrame | undefined;
  calcData :rowData[] = [];

  constructor() { }
  SetData(V_P:dfd.DataFrame){
    this.P = V_P;
    console.log("V_P...");
    V_P.print();
    console.log("construct shock ... ")
  }

  public onPlotClick(plot: any){
    this.calcData[plot.curveNumber - 1] = {name: "t_P" + (plot.curveNumber).toString(), value: plot.x, unit:"s"};
    
    //Vの行は4行めから
    this.calcData[4] ={name : "V12", value: 0.5/(this.calcData[1].value - this.calcData[0].value), unit: "m/s"};
    this.calcData[5] ={name : "V23", value: 1.17/(this.calcData[2].value - this.calcData[1].value), unit: "m/s"};
    this.calcData[6] ={name : "V34", value: 0.5/(this.calcData[3].value - this.calcData[2].value), unit: "m/s"}; 
  }

  public getVelocity() : any{
    return this.calcData.slice(4, 6);
  }
  public getData() {
    return this.calcData;
  }

  public write(wb: any): void {
    if(this.P == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    const table1Data = [
      this.calcData.slice(0, 4)
    ];
    const ws = XLSX.utils.json_to_sheet(table1Data, {skipHeader:true})

    XLSX.utils.sheet_add_json(ws,[
        ["V12", "V23", "V34"],
        ["m/s", "m/s", "m/s"],
        ...this.getVelocity()
    ], {skipHeader:true, origin:"F1"});

    XLSX.utils.book_append_sheet(wb, ws, 'shock');
  }
}
