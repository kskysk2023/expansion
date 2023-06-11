import { Injectable } from '@angular/core';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';
import { rowData } from './app.component';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';
import { Subject } from 'rxjs';

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
  public calcData :rowData[] = [];
  dataShock = new ReplaySubject<rowData[]>;
  private eventSubject = new Subject<any>;

  constructor() { }

  getEvent(){
    return this.eventSubject.asObservable();
  }

  emitEvent(event : string){
    this.eventSubject.next(event);
  }

  SetData(V_P:dfd.DataFrame){
    console.log("V_P...");
    V_P.print();

    this.P = V_P;
    this.P.columns[0] = "t"
    this.P.columns[1] = "Med1"
    this.P.columns[2] = "Med2"
    this.P.columns[3] = "Low1"
    this.P.columns[4] = "Low2"
  
    this.P.print();

    //計算が完了したことを報告
    console.log("計算完了衝撃波");
    this.emitEvent("load");
  }

  public onPlotClick(plot: any){
    //立ち上がりの時刻を代入
    this.calcData[plot.curveNumber - 1] = {name: "t_P" + (plot.curveNumber).toString(), value: plot.x, unit:"s"};
    //時間差を計算
    this.calcData[4] = {name: "t12", value: (this.calcData[1].value - this.calcData[0].value), unit:"s"};
    this.calcData[5] ={name : "t23", value: (this.calcData[2].value - this.calcData[1].value), unit: "s"};
    this.calcData[6] ={name : "t34", value: (this.calcData[3].value - this.calcData[2].value), unit: "s"}; 

    //Vの行は4行めから
    this.calcData[7] ={name : "V12", value: 0.5/this.calcData[4].value, unit: "m/s"};
    this.calcData[8] ={name : "V23", value: 1.17/this.calcData[5].value, unit: "m/s"};
    this.calcData[9] ={name : "V34", value: 0.5/this.calcData[6].value, unit: "m/s"}; 

    console.log("shock data...." , this.calcData)
    this.dataShock.next(this.calcData);
  }

  public getVelocity() : rowData[]{
    return this.calcData.slice(4, 6);
  }
  public getTP() : rowData[]{
    return this.calcData.slice(0, 4);
  }
  public getData() {
    return this.dataShock;
  }

  public write(wb: any): void {
    if(this.P == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    const t = [
      this.calcData.map((value) => value.name),
      this.calcData.map((value) => value.unit),
      this.calcData.map((value) => value.value)
    ];
    console.log(t);
    const ws = XLSX.utils.json_to_sheet(t, {skipHeader:true});

    XLSX.utils.book_append_sheet(wb, ws, 'shock');
  }
}
