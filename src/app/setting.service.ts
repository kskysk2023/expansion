import { Injectable } from '@angular/core';
import { of } from 'rxjs/internal/observable/of';
import * as dfd from 'danfojs';
import { BehaviorSubject, Subject } from 'rxjs';
import * as XLSX from 'xlsx';
import { Bind } from './comp/comp.component';

export interface Condition{
  Shot:number;
  bind:Bind;
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
  condition : Condition|undefined;
  private eventSubject = new Subject<any>;

  constructor() { }
  setDataFrame(df : dfd.DataFrame){
    this.df = df;
    this.emitEvent("load");
  }
  getDataFrame(){return this.df;}

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

  setExcelResult(data: any){
    this.wbresult = XLSX.read(data, { type: 'array' });
    const sheetName = this.wbresult.SheetNames[0];
    this.wsresult = this.wbresult.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(this.wsresult, { header: 1 });
    
    console.log('ShockTube結果:', jsonData);
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

      const b: Bind = {R: {g:rowData[10], P:rowData[14]}, C:{g:rowData[11], P:rowData[15]}, M:{g:rowData[12], P:rowData[16]}, L:{g:rowData[13], P:rowData[17]}, Dth:rowData[6],
                       T0 : 300, Wp:Wp, groove:rowData[9]};
      return b;
    } else {
      console.log('Excelパート名に一致するセルが見つかりませんでした');
    }
    return undefined;
  }
}