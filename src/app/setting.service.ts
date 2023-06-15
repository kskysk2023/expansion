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
  mats = ["Al", "spcc", "PLA", "ABS"];

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
    let b  : {[key : string] : {value : number, unit : string}} = {};
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

      b["kR"] = {value : getKappaM(rowData[10]).kappa, unit:"-"};
      b["kC"] = {value : getKappaM(rowData[11]).kappa, unit:"-"};
      b["kM"] = {value : getKappaM(rowData[12]).kappa, unit : "-"}
      b["kL"] = {value : getKappaM(rowData[13]).kappa, unit : "-"};

      b["MR"] = {value : getKappaM(rowData[10]).M, unit:"-"};
      b["MC"] = {value : getKappaM(rowData[11]).M, unit:"-"};
      b["MM"] = {value : getKappaM(rowData[12]).M, unit : "-"}
      b["ML"] = {value : getKappaM(rowData[13]).M, unit : "-"};

      b["Dth"] = {value : rowData[6], unit : "mm"};
      b["T0"] = {value : 300, unit : "K"};
      b["Wp"] = {value : Wp, unit : "kg"};
      b["groove"] = {value : rowData[9], unit: "mm"};

      b["matd1"] = {value: this.mats.indexOf(rowData[7]), unit : "-"}
      b["td2"] = {value : rowData[8], unit: "μm"};

      b["PR0"] = {value : rowData[14], unit:"MPa"};
      b["PC0"] = {value : rowData[15], unit:"kPa"};
      b["PM0"] = {value : rowData[16], unit : "kPa"}
      b["PL0"] = {value : rowData[17], unit : "Pa"};

    } else {
      console.log('Excelパート名に一致するセルが見つかりませんでした');
      b["kR"] = {value : NaN, unit:"-"};
      b["kC"] = {value : NaN, unit:"-"};
      b["kM"] = {value : NaN, unit : "-"}
      b["kL"] = {value : NaN, unit : "-"};

      b["MR"] = {value : NaN, unit:"-"};
      b["MC"] = {value : NaN, unit:"-"};
      b["MM"] = {value : NaN, unit : "-"}
      b["ML"] = {value : NaN, unit : "-"};

      b["Dth"] = {value : NaN, unit : "mm"};
      b["T0"] = {value : 300, unit : "K"};
      b["Wp"] = {value : NaN, unit : "kg"};
      b["groove"] = {value : NaN, unit: "mm"};
      b["matd1"] = {value: NaN, unit : "-"}
      b["td2"] = {value :NaN, unit: "μm"};

      b["PR0"] = {value : NaN, unit:"MPa"};
      b["PC0"] = {value : NaN, unit:"kPa"};
      b["PM0"] = {value : NaN, unit : "kPa"}
      b["PL0"] = {value : NaN, unit : "Pa"};

    }
    return b;
  }
}