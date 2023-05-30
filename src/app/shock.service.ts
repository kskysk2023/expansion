import { Injectable } from '@angular/core';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';

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
  public t_P :number[] = [0,0,0,0];

  constructor() { }
  SetData(V_P:dfd.DataFrame){
    this.P = V_P;
    console.log("V_P...");
    V_P.print();
    console.log("construct shock ... ")
  }

  public onPlotClick(plot: any){
    this.t_P[plot.curveNumber - 1] = plot.x;
    console.log(this.t_P);
  }

  public getVelocity() : number[]{
    return [0.5/(this.t_P[1] -this.t_P[0]), 1.17/(this.t_P[2] - this.t_P[1]), 0.5/(this.t_P[3] - this.t_P[2])];
  }

  public write(wb: any): void {
    if(this.P == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    const table1Data = [
      ["t_P1", "t_P2", "t_P3", "t_P4"],
      ["s",    "s",    "s",    "s"],
      [this.t_P[0], this.t_P[1], this.t_P[2], this.t_P[3]]
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
