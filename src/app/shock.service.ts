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
  public t_P :rowData[] = [];
  Dt_P : rowData[] = [];
  vs : rowData[] = [];
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
    const names = ["t", "Med1", "Med2", "Low1", "Low2"]
    for (let index = 0; index < this.P.columns.length; index++) {
      this.P.columns[index] = names[index];   
    }
  
    this.P.print();

    //計算が完了したことを報告
    console.log("計算完了衝撃波");
    this.emitEvent("load");
  }

  public onPlotClick(num:number, time: number){
    //立ち上がりの時刻を代入
    this.t_P[num] = {name: "t_P" + (num + 1).toString(), value: time, unit:"s"};

    //一戸隣の立ち上がりが計算されているときだけ
    if(this.t_P[num - 1] || this.t_P[num + 1]){
      const n1 = this.t_P[num - 1]?num - 1 : num;
      const n2 = this.t_P[num - 1]?num : num + 1;
 
      //時間差を計算
      this.Dt_P[n1] = {name: "Δt" + ((n1 + 1) * 10 + (n2 + 1)).toString() , value: (this.t_P[n2].value - this.t_P[n1].value), unit:"s"};
      //Vの行
      this.vs[n1] ={name : "V" + ((n1 + 1) * 10 + (n2 + 1)).toString(), value: 0.5/this.Dt_P[n1].value, unit: "m/s"};

    }
    const calcData = [...this.t_P, ...this.Dt_P , ...this.vs]
    this.dataShock.next(calcData);
    console.log("shock data...." , calcData)
  }

  public getVelocity() : rowData[]{
    return this.vs;
  }
  public getTP() : rowData[]{
    return this.t_P;
  }
  public getData() {
    return this.dataShock;
  }

  public write(wb: any): void {
    if(this.P == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    const calcData = [...this.t_P, ...this.Dt_P, ...this.vs];
    const t = [
      calcData.map((value) => value.name),
      calcData.map((value) => value.unit),
      calcData.map((value) => value.value)
    ];
    console.log(t);
    const ws = XLSX.utils.json_to_sheet(t, {skipHeader:true});

    XLSX.utils.book_append_sheet(wb, ws, 'shock');
  }
}
