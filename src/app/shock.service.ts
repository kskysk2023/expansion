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
  data : {[key : string]: {value: number, unit : string}} = {};
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
    const names = ["t", "Med1", "Med2", "Low1", "Low2", "Pitot"]
    for (let index = 0; index < this.P.columns.length; index++) {
      this.P.columns[index] = names[index];   
    }
  
    this.P.print();

    //計算が完了したことを報告
    console.log("計算完了衝撃波");
    this.emitEvent("load");
  }
  
  public getData() : rowData[]{
    const keys = Object.keys(this.data).sort();
    let sortedData: {[key : string]: {value: number, unit : string}} = {};
    for(let key of keys){
      sortedData[key] = this.data[key];
    }
    return Object.keys(sortedData).map((key) => {
      return {
        name: key,
        value: sortedData[key].value,
        unit: sortedData[key].unit,
      };
    })
  }

  public onPlotClick(num:number, time: number){
    //立ち上がりの時刻を代入
    const name_t = "t_P" + (num + 1).toString();
    this.data[name_t] = {value: time, unit:"s"};
    if(this.P){
      for (let index = 0; index < this.P.columns.length; index++) {
        //隣の立ち上がりが入力されていたら
        if(this.data["t_P" + (index + 2).toString()]){
          //時間差を計算
          const name = "Δt" + ((index + 1) * 10 + (index + 2)).toString()
          this.data[name] = {
            value: (this.data["t_P" + (index + 2).toString()].value - this.data["t_P" + (index + 1).toString()].value),
            unit:"s"
          };
          //中圧管と低圧管の間は長さが違う
          const name_v = "V" + ((index + 1) * 10 + (index + 2)).toString()
          const l = (index == 1?1.17:0.5);
          this.data[name_v] = {
            value: l/this.data[name].value,
            unit: "m/s"
          };          
        }
      }
    }
    this.dataShock.next(this.getData());
    console.log("shock data...." , this.getData());
  }

  public getDataSource() {
    return this.dataShock;
  }
  public getTP() : rowData[]{
    const r : rowData[] = [];
    this.getData().forEach((value: rowData, index) => {
      if(value.name.startsWith("t_P")){
        r.push(value);
      }
    })
    return r;
  }
  public setCalculatedData(df : dfd.DataFrame){
    const datas = dfd.toJSON(df.iloc({columns:["0:"], rows: ["0:2"] })) as rowData[];
    console.log(datas);
    const series = Object.entries(datas);
    console.log(series);
    Object.entries(datas[0]).forEach(([key, unit]) => {
      this.data[key] = {value: 0, unit : unit};
    })
    console.log(this.data);
    Object.entries(datas[1]).forEach(([key, value]) => {
      this.data[key].value = value;
    })
    this.emitEvent("load")
  }

  public write(wb: any): void {
    if(this.P == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    const f = this.getData();
    const t = [
      Object.values(f).map((value) => value.name),
      Object.values(f).map((value) => value.unit),
      Object.values(f).map((value) => value.value)
    ];
    console.log(t);
    const ws = XLSX.utils.json_to_sheet(t, {skipHeader:true});

    XLSX.utils.book_append_sheet(wb, ws, 'shock');
  }
}
