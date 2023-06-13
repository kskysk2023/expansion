import { Injectable } from '@angular/core';
import { of } from 'rxjs/internal/observable/of';
import * as dfd from 'danfojs';
import { BehaviorSubject, Subject } from 'rxjs';
import * as XLSX from 'xlsx';
import { getKappaM } from './comp.service';

export interface Condition{
  Shot:number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private CHBindSubject = new BehaviorSubject<any>({});

  filename = "";
  excelPartName = "";

  df : dfd.DataFrame = new dfd.DataFrame;
  wbresult: XLSX.WorkBook|undefined;
  wsresult: XLSX.WorkSheet |undefined;
  private eventSubject = new Subject<any>;
  t : dfd.Series = new dfd.Series;

  constructor() { }
  setDataFrame(df : dfd.DataFrame){
    this.df = df;
    this.t = df["時間[s]"];
    this.emitEvent("load");
  }
  getDataFrame(){return this.df;}
  setTime(t :dfd.Series){
    this.t = t
    this.emitEvent("load")
  }
  getTime(){return this.t}

  updateCHBindProperty(bind: any) {
    this.CHBindSubject.next(bind);
  }
  getCH(){
    return this.CHBindSubject.value;
  }

  getEvent(){
    return this.eventSubject.asObservable();
  }

  emitEvent(event : string){
    this.eventSubject.next(event);
  }
  
  getOoutFileName(){
    return this.filename.slice(0, -11) + ".xlsx";
  }

  setFileName(filename: string){
    this.filename = filename;
    const nameparts = filename.split("_");
    
    this.excelPartName = "20" + nameparts[1].slice(0, 2) + "_" + nameparts[1].slice(2) + "_" + nameparts[0].slice(0, 4);
    console.log(this.excelPartName);
  }

  setExcelResult(wb: any, ws :any){
    this.wbresult = wb;
    this.wsresult = ws;
  }

  findCellByValue(worksheet: XLSX.WorkSheet, value: string) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
  
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v === value) {
          const rowRange = XLSX.utils.decode_range(worksheet['!ref'] as string);
          const rowData: any[] = [];
          
          for (let i = rowRange.s.c; i <= rowRange.e.c; i++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: i });
            const cell = worksheet[cellAddress];
            
            rowData.push(cell ? cell.v : undefined);
          }
          
          return rowData;
        }
      }
    }
    return undefined;
  }

  getResult() {
    if(this.wsresult == undefined){
      console.log("実験データを読み込む必要がある");
      return;
    }
    const rowData = this.findCellByValue(this.wsresult as XLSX.WorkSheet, this.excelPartName);
    //見つからなかったときのデータ
    let b ={"R": 28.8, "C": 4, "M": 28, "L": 28.8, 
    "PR0" :1, "PC0":101.3, "PM0":1,"PL0":10,
    "Dth": 15, "T0" : 300, "Wp": 0.28, "groove":1};
    if (rowData) {
      console.log('Excelパート名に一致するセルの値:', rowData);

      //sellからデータへ
      let Wp = 0.28;
      if(rowData[7] == "SUS"){
        Wp = 0.99;
      }
      else if(rowData[7] == "Al"){
        Wp = 0.28;
      }
      else if(rowData[7] == "MC60"){
        Wp = 0.17;
      }

      b = {"R": getKappaM(rowData[10]).M,
          "C": getKappaM(rowData[11]).M,
          "M": getKappaM(rowData[12]).M,
          "L": getKappaM(rowData[13]).M,
          "Dth":rowData[6],
          "PR0" :rowData[14],
          "PC0" :rowData[15],
          "PM0" : rowData[16],
          "PL0" : rowData[17],
          "T0" : 300, "Wp":Wp, "groove":rowData[9]};
    } else {
      console.log('Excelパート名に一致するセルが見つかりませんでした');
    }
    return b;
  }
}