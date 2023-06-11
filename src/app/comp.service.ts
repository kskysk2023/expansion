import { Injectable } from '@angular/core';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';
import { rowData } from './app.component';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';
import { Bind } from './comp/comp.component';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CompService {
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
  public Pc: dfd.DataFrame | undefined;
  private Pmax: number = 0;
  private Pr: number = 0;
  private PrIndex: number = 0;
  private H_end_row: number = 0;
  private t_hold_start: number = 0;
  private t_hold_end: number = 0;
  dataComp = new ReplaySubject<rowData[]>;
  data : {[key : string]: {value: number, unit : string}} = {};
  bind :Bind = {R: {g: "Air", P:1}, C:{g:"He", P:101.3}, M:{g:"Air", P:1}, L:{g:"Air", P:100}, Dth:15, T0 : 300, Wp:0.28, groove:1.00};
  private eventSubject = new Subject<any>;

  constructor() { }

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
    console.log("Pc... ");
    this.Pc.addColumn("Pc", this.Pc["CH1-1[V]"].add(1.4).mul(25.482), {inplace:true});
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

    this.t_hold_start = this.senkeiKinjix(this.Pc["t"].iat(this.PrIndex - 1), this.Pc["t"].iat(this.PrIndex), this.Pc["Pc"].iat(this.PrIndex - 1), this.Pc["Pc"].iat(this.PrIndex), this.Pr);
    this.t_hold_end = this.senkeiKinjix(this.Pc["t"].iat(this.H_end_row - 1), this.Pc["t"].iat(this.H_end_row), this.Pc["Pc"].iat(this.H_end_row - 1), this.Pc["Pc"].iat(this.H_end_row), this.Pr);
    console.log("construct compressiontube ... "+ this.Pmax, this.Pr, this.PrIndex, this.H_end_row, this.t_hold_start, this.t_hold_end)

    this.Pc.addColumn("tm", this.Pc["t"].mul(1000), {inplace:true});
    
    //計算が完了したことを報告
    console.log("計算完了圧力");
    this.emitEvent("load");
  }
  public setCalculatedData(data : dfd.DataFrame){
    this.Pc = data.iloc({columns: ["0:3"]})
    const datas = dfd.toJSON(data.iloc({columns:["4:"], rows: ["0:2"] })) as rowData[];
    const gass = dfd.toJSON(data.iloc({columns:["4:8"], rows: ["5"]})) as string[];

    Object.entries(datas[0]).forEach(([key, unit]) => {
      this.data[key] = {value: 0, unit : unit};
    })
    console.log(this.data);
    Object.entries(datas[1]).forEach(([key, value]) => {
      this.data[key].value = value;
    })
    console.log(this.data["kR"].value, this.data["kR"].unit);
    const b: Bind = {
      R:{g:gass[0], P:this.data["PR0"].value},
      C:{g:gass[1], P:this.data["Pc0"].value},
      M:{g:gass[2], P:this.data["PM0"].value},
      L:{g:gass[3], P:this.data["PL0"].value},
      Dth:this.data["D*"].value,
      T0 : this.data["T0"].value,
      Wp:this.data["Wp"].value,
      groove:this.data["groove"].value
    };
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
  private calc(){
    if(this.Pc == undefined){
      console.log("先にPcを読み込む必要がある")
      return;
    }

    //計算する
    //実験条件を入力していることを確認
    this.data["Dc"] =  {value: 50, unit: "mm"  }
    this.data["Lc"] = {value: 2, unit: "m"  }

    this.data["alpha"] = {value: (this.data["D*"].value**2*this.data["a0"].value)/(this.data["Dc"].value**2*this.data["aR0"].value), unit: "-"  } // 10
    this.data["V0"] = {value: Math.PI/4*(this.data["Dc"].value*10**-3)**2*this.data["Lc"].value, unit: "m3"  }
    this.data["omega"] = {value: Math.sqrt((2*(this.data["k"].value-1)*((this.data["k"].value+1)/2)**((this.data["k"].value+1)/(this.data["k"].value-1))*this.data["Pc0"].value*10**3*this.data["V0"].value/(this.data["Wp"].value*this.data["alpha"].value**2*this.data["aR0"].value**2))), unit: "-"  }
    this.data["PcMax"] = {value: this.Pmax, unit: "MPa"  }
    this.data["tMax"] = {value: this.Pc["t"].iloc(this.Pc["Pc"].eq(this.Pmax)).values[0], unit: "s"  } // 15
    this.data["Pr"] = {value: this.Pr, unit: "MPa"  }
    this.data["tr"] = {value: this.t_hold_start, unit: "s"  }
    this.data["Tr"] = {value: this.data["T0"].value*((this.data["Pc0"].value*10**3)/(this.data["Pr"].value*10**6))**((1-this.data["k"].value)/this.data["k"].value), unit: "K"  }
    this.data["ar"] = {value: Math.sqrt(this.data["k"].value*8314.3/4*this.data["Tr"].value), unit: "m/s"  }
    this.data["UR"] = {value: (2/(this.data["k"].value+1))**((this.data["k"].value+1)/(2*(this.data["k"].value-1)))*this.data["D*"].value**2/this.data["Dc"].value**2*this.data["ar"].value , unit: "m/s"  }// 20
    this.data["holding time end"] = {value: this.t_hold_end, unit: "s"  }
    this.data["Holding Time"] =  { value: (this.data["holding time end"].value - this.data["tr"].value) * 10**6, unit: "us"  }

    this.dataComp.next(this.getData());
  }

  public setCondition(){
    const condition = this.bind;
    //音速より先に温度を設定することに注意
    this.data["D*"] = {value: condition.Dth, unit : "mm"};
    this.data["T0"] = {value: condition.T0, unit : "K"};
    this.data["Wp"] = {value: condition.Wp, unit : "kg"};
    this.data["groove"] = {value: this.bind.groove, unit : "mm"};

    const getKappaMol = (name : string) => {
      let kappa = 1.4;
      let Mol = 28.8;      
      if(name == "Air"){
        kappa = 1.4;
        Mol = 28.8;
      }else if(name == "N2"){
        kappa = 1.4;
        Mol = 28;
      }else if(name == "He"){
        kappa = 1.67;
        Mol = 4;
      }
      return {k : kappa, Mol : Mol};
    }

    //まず貯気槽について
    const R = getKappaMol(this.bind.R.g);
    this.data["molR"] = {value : R.Mol, unit: "-"}
    this.data["kR"] = {value: R.k, unit : "-"}
    this.data["aR0"] = {value: Math.sqrt(this.data["kR"].value*8314.3/R.Mol*this.data["T0"].value), unit: "m/s"};
    this.data["PR0"] = {value : this.bind.R.P, unit: "MPa"}
    
    //次に圧縮管について
    const C = getKappaMol(this.bind.C.g);
    this.data["molR"] = {value : C.Mol, unit: "-"}
    this.data["k"] = {value: C.k, unit: "-"};
    this.data["a0"] = {value: Math.sqrt(this.data["k"].value*8314.3/C.Mol*this.data["T0"].value), unit : "m/s"};
    this.data["Pc0"] = {value: condition.C.P, unit : "kPa"};

    //中圧管
    const M = getKappaMol(this.bind.M.g);
    this.data["molM"] = {value : M.Mol, unit: "-"}
    this.data["kM"] = {value: M.k, unit: "-"};
    this.data["PM0"] = {value: this.bind.M.P, unit: "kPa"};

    const L = getKappaMol(this.bind.L.g);
    this.data["molL"] = {value : L.Mol, unit: "-"}
    this.data["kL"] = {value: L.k, unit: "-"};
    this.data["PL0"] = {value: this.bind.L.P, unit: "Pa"};
    this.calc();
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
    console.log(t);
    XLSX.utils.sheet_add_json(ws, t, {skipHeader:true, origin:"E1"});

    XLSX.utils.sheet_add_json(ws, [["高圧気体", "圧縮管気体", "中圧管気体", "低圧管気体"],
                                   [this.bind.R.g, this.bind.C.g, this.bind.M.g, this.bind.L.g]], {skipHeader: true, origin:"E5"})

    XLSX.utils.book_append_sheet(wb, ws, 'comp');
  }
}
