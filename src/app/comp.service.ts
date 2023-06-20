import { Injectable } from '@angular/core';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';
import { rowData } from './app.component';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';
import { Subject } from 'rxjs';

export function senkeiKinji(x1: number, x2: number, y1: number, y2: number, x: number): number {
  const y = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
  console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
  return y;
}

export function senkeiKinjix(x1: number, x2: number, y1: number, y2: number, y: number): number {
  const x = ((x2 - x1) / (y2 - y1)) * (y - y1) + x1;
  console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
  return x;
}
export function getKappaM(name : string) {
  let kappa = 10e4;
  let M = 2e4;      
  if(name == "Air"){
    kappa = 1.4;
    M = 28.8;
  }else if(name == "N2"){
    kappa = 1.4;
    M = 28;
  }else if(name == "He"){
    kappa = 1.67;
    M = 4;
  }
  return {kappa, M};
}
export function getNameFromM(M : number){
  let name = "×";   
  if(M == 28.8){
    name = "Air"
  }else if(M == 28){
    name = "N2"
  }else if(M == 4){
    name = "He"
  }
  return name;
}
@Injectable({
  providedIn: 'root'
})
export class CompService {
  public Pc: dfd.DataFrame | undefined;
  private Pmax: number = 0;
  private Pr: number = 0;
  private PrIndex: number = 0;
  private H_end_row: number = 0;
  private t_hold_start: number = 0;
  private t_hold_end: number = 0;
  dataComp = new ReplaySubject<rowData[]>;
  public data : {[key : string]: {value: number, unit : string}} = {};
  private eventSubject = new Subject<any>;

  constructor() {
    this.data["Dth"] = {value : NaN, unit:"mm"}
    this.data["T0"] = {value : NaN, unit:"kC"},
    this.data["Wp"] = {value : NaN, unit : "kg"},
    this.data["groove"] = {value : NaN, unit : "mm"}
    this.data["td2"] = {value : NaN, unit : "mm"}
    this.data["matd1"] = {value : NaN, unit : "-"}


    this.data["PR0"] = {value : NaN, unit : "MPa"}
    this.data["PC0"] = {value : NaN, unit : "kPa"}
    this.data["PM0"] = {value : NaN, unit : "kPa"}
    this.data["PL0"] = {value :NaN, unit : "Pa"}

    this.data["MR"] = {value : NaN, unit : "-"}
    this.data["MC"] = {value : NaN, unit : "-"}
    this.data["MM"] = {value : NaN, unit : "-"}
    this.data["ML"] = {value : NaN, unit : "-"}
  }

  getEvent(){
    return this.eventSubject.asObservable();
  }

  emitEvent(event : string){
    this.eventSubject.next(event);
  }

  SetData(V_Pc:dfd.DataFrame){
    this.Pc = V_Pc;
    console.log("V_Pc...");
    V_Pc.print();

    const secondColumn = V_Pc.columns[1];
    console.log(secondColumn)
    this.Pc.addColumn("Pc", this.Pc.column(secondColumn).add(1.4).mul(25.482), {inplace:true});
    this.Pc = this.Pc.rename({"時間[s]":"t", 1: "Pc"});
    console.log("Pc....");
    this.Pc.print();
    
    this.Pmax = this.Pc["Pc"].max();
    this.Pr = this.Pmax * 0.9;

    this.PrIndex =  this.Pc["Pc"].loc(this.Pc["Pc"].ge(this.Pr)).index[0]; //最大圧の0.9倍の圧力を探し、prとする
    this.Pc["Pc"].iloc(Array.from({length : this.Pc["Pc"].shape[0] - this.PrIndex}, (_, i) => this.PrIndex + i + 1)).print()
    this.H_end_row = this.PrIndex + this.Pc["Pc"].loc(
      this.Pc["Pc"].iloc(Array.from({
        length : this.Pc["Pc"].shape[0] - this.PrIndex},
         (_, i) => this.PrIndex + i + 1
      )).le(this.Pr)).index[0];
    console.log("PrIndex...",this.PrIndex, "H_end_row...", this.H_end_row);

    this.t_hold_start = senkeiKinjix(this.Pc["t"].iat(this.PrIndex - 1), this.Pc["t"].iat(this.PrIndex), this.Pc["Pc"].iat(this.PrIndex - 1), this.Pc["Pc"].iat(this.PrIndex), this.Pr);
    this.t_hold_end = senkeiKinjix(this.Pc["t"].iat(this.H_end_row - 1), this.Pc["t"].iat(this.H_end_row), this.Pc["Pc"].iat(this.H_end_row - 1), this.Pc["Pc"].iat(this.H_end_row), this.Pr);
    console.log("construct compressiontube ... "+ this.Pmax, this.Pr, this.PrIndex, this.H_end_row, this.t_hold_start, this.t_hold_end)

    this.Pc.addColumn("tm", this.Pc["t"].mul(1000), {inplace:true});
    
    //計算が完了したことを報告
    console.log("計算完了圧力");
    this.emitEvent("load");
  }
  public setCalculatedData(data : dfd.DataFrame){
    this.Pc = data.iloc({columns: ["0:3"], rows:["1:"]})
    const datas = dfd.toJSON(data.iloc({columns:["3:"], rows: ["0:2"] })) as rowData[];
    
    Object.entries(datas[0]).forEach(([key, unit]) => {
      this.data[key] = {value: 0, unit : unit};
    })
    console.log(this.data);
    Object.entries(datas[1]).forEach(([key, value]) => {
      this.data[key].value = value;
    })
    console.log(this.data["kR"].value, this.data["kR"].unit);
    console.log(this.data["Dth"], this.data["Dth"].unit)

    this.dataComp.next(this.getData());
    this.emitEvent("load");
  }

  public getDataSource(){
    return this.dataComp;
  }

  public getData() : rowData[]{
    return Object.keys(this.data).map((key) => {
      return {
        name: key,
        value: this.data[key].value,
        unit: this.data[key].unit,
      };
    })
  }
  public calc(){
    if(this.Pc == undefined){
      console.log("先にPcを読み込む必要がある")
      return;
    }
    //音速より先に温度を設定することに注意

    //まず貯気槽について
    this.data["aR0"] = {value: Math.sqrt(this.data["kR"].value*8314.3/this.data["MR"].value*this.data["T0"].value), unit: "m/s"};
    
    //次に圧縮管について
    this.data["a0"] = {value: Math.sqrt(this.data["kC"].value*8314.3/this.data["MC"].value*this.data["T0"].value), unit : "m/s"};

    //計算する
    //実験条件を入力していることを確認
    this.data["Dc"] =  {value: 50, unit: "mm"  }
    this.data["Lc"] = {value: 2, unit: "m"  }

    this.data["alpha"] = {value: (this.data["Dth"].value**2*this.data["a0"].value)/(this.data["Dc"].value**2*this.data["aR0"].value), unit: "-"  } // 10
    this.data["V0"] = {value: Math.PI/4*(this.data["Dc"].value*10**-3)**2*this.data["Lc"].value, unit: "m3"  }
    this.data["omega"] = {value: Math.sqrt((2*(this.data["kC"].value-1)*((this.data["kC"].value+1)/2)**((this.data["kC"].value+1)/(this.data["kC"].value-1))*this.data["PC0"].value*10**3*this.data["V0"].value/(this.data["Wp"].value*this.data["alpha"].value**2*this.data["aR0"].value**2))), unit: "-"  }
    this.data["PcMax"] = {value: this.Pmax, unit: "MPa"  }
    this.data["tMax"] = {value: this.Pc["t"].iloc(this.Pc["Pc"].eq(this.Pmax)).values[0], unit: "s"  } // 15
    this.data["Pr"] = {value: this.Pr, unit: "MPa"  }
    this.data["tr"] = {value: this.t_hold_start, unit: "s"  }
    this.data["Tr"] = {value: this.data["T0"].value*((this.data["PC0"].value*10**3)/(this.data["Pr"].value*10**6))**((1-this.data["kC"].value)/this.data["kC"].value), unit: "kC"  }
    this.data["ar"] = {value: Math.sqrt(this.data["kC"].value*8314.3/4*this.data["Tr"].value), unit: "m/s"  }
    this.data["UR"] = {value: (2/(this.data["kC"].value+1))**((this.data["kC"].value+1)/(2*(this.data["kC"].value-1)))*this.data["Dth"].value**2/this.data["Dc"].value**2*this.data["ar"].value , unit: "m/s"  }// 20
    this.data["holding time end"] = {value: this.t_hold_end, unit: "s"  }
    this.data["Holding Time"] =  { value: (this.data["holding time end"].value - this.data["tr"].value) * 10**6, unit: "us"  }

    this.dataComp.next(this.getData());
  }

  public write(wb: any): void {
    if(this.Pc == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }

    var d : dfd.DataFrame = new dfd.DataFrame([this.Pc["t"].values, this.Pc["tm"].values, this.Pc["Pc"].values]).transpose();
    d.tail().print()
    const table1Data = [
      ["t", "t", "Pc"],
      ["s", "ms", "MPa"],
      ...d.values
    ];

    const ws = XLSX.utils.json_to_sheet(table1Data, {skipHeader:true})
    const t = [
      Object.keys(this.data),
      Object.values(this.data).map((value) => value.unit),
      Object.values(this.data).map((value) => value.value)
    ];
    XLSX.utils.sheet_add_json(ws, t, {skipHeader:true, origin:"E1"});
   
    XLSX.utils.book_append_sheet(wb, ws, 'comp');
  }
}
