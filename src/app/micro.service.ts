import { Injectable, OnInit } from '@angular/core';
import * as dfd from "danfojs";
import { Subject } from 'rxjs';
import * as XLSX from "xlsx";
@Injectable({
  providedIn: 'root'
})
export class MicroService implements OnInit {
  public PistonData: dfd.DataFrame | undefined;
  public RuptData: dfd.DataFrame | undefined;
  private num: number | undefined;
  private tati :number = 0;
  private ts: number | undefined;
  private eventSubject = new Subject<any>;

  constructor() { }
  ngOnInit(): void { }
  getEvent(){
    return this.eventSubject.asObservable();
  }
  emitEvent(event : string){
    this.eventSubject.next(event);
  }
  SetData(IQ: dfd.DataFrame, mode : "piston" | "rupture") {
    const data = IQ; // this.data を data に置き換え
    data.print();
    const names = ["t", "I", "Q"];
    for (let index = 0; index < data.columns.length; index++) {
      data.columns[index] = names[index];
    }
  
    //this.IQ["時間[s]"].print()
    data.print();
    data.tail().print();
    this.num = data.shape[0];
  
    console.log(data.columns);
  
    data.print();
    data.addColumn("P", data.column("I").pow(2).add(data.column("Q").pow(2)), { inplace: true });
  
    const tt = data.column("P").loc(data["P"].ge(0.0025)).index[0];
    if (tt == undefined) {
      this.tati = 0;
    } else {
      this.tati = tt as number;
    }
    console.log(data.column("t").iat(this.tati) as number);
    //立ち上がりをt=0にする
    data.column("t").sub(data.column("t").iat(this.tati) as number, { inplace: true });
    console.log("`始まりはt=", data.column("t").iat(this.tati) as number * 1000 + "ms");
    //msスケールも作る
    data.addColumn("tm", data.column("t").mul(1000), { inplace: true });
  
    console.log("calculating θ...");
    data.addColumn("θ", data.apply(
      (row: any) => {
        if (typeof row[2] != "number" || typeof row[1] != "number") console.log(row, typeof row[2]);
        return Math.atan2(row[2], row[1]);
      }
    ) as dfd.Series, { inplace: true });
    data["θ"].print();
  
    console.log("calculating Δθ...");
  
    var shiftarr: number[] = data["θ"].copy().values;
    shiftarr.unshift(0);
    shiftarr.pop();
    console.log(shiftarr);
    var shifted = new dfd.Series(shiftarr);
    shifted.print();
    console.log("θ...");
    data.column("θ").print();
    //data.column("θ").sub(shifted).print();
    data.addColumn("Δθ", data.column("θ").sub(shifted), { inplace: true });
  
    console.log("calculating Δn...");
    data.addColumn("Δn", data["Δθ"].apply((element: number) => {
      if (element == undefined || Math.abs(element) < 5) {
        return 0; // 最初の要素の場合は差分を計算できないのでnullを返す
      } else {
        return -element / Math.abs(element);
      }
    }) as dfd.Series, { inplace: true });
  
    console.log("calculating n...");
    const n: number[] = [0];
    const dn = data["Δn"].values;
    console.log(this.num);
    for (var i = 1; i < this.num; i++) {
      n.push(dn[i] + n[i - 1]);
    }
    data.addColumn("n", new dfd.Series(n) as dfd.Series, { inplace: true });
  
    console.log("calculating ...θs");
    var thetaS: number[] = [];
    const theta: number[] = data["θ"].values;
    for (var i = 0; i < this.num; i++) {
      if (dn[i] != 0) {
        thetaS.push(2.0 * n[i] * Math.PI - Math.PI);
      } else {
        thetaS.push(theta[i] + 2.0 * n[i] * Math.PI);
      }
    }
    data.addColumn("θs", new dfd.Series(thetaS) as dfd.Series, { inplace: true });
    data["θs"].sub(data["θs"].iat(this.tati), { inplace: true }); //0点合わせ
  
    data.addColumn("x", data["θs"].mul(0.06522).div(2.0 * Math.PI), { inplace: true });
  
    const f = data.column("t").iat(4) as number;
    if (f != undefined) {
      this.ts = data.column("t").iat(5) as number - f;
    } else {
      this.ts = 0;
    }
    //data["v"] = data["x"].diff({ periods: 1, axis: 0 }).div(this.ts).values[0];
  
    data.print();
  
    //計算が完了したことを報告
    console.log("計算完了マイクロ波");
    this.emitEvent("load");
  
    if(mode == "piston"){
      this.PistonData = data;
    }else {
      this.RuptData = data;
    }
  }
  public setCalculatedData(df : dfd.DataFrame, mode: "piston" | "rupture"){
    if(mode == "piston"){
      this.PistonData = df.drop({index:[0]});
    }
    else if(mode == "rupture"){
      this.RuptData = df.drop({index:[0]});
    }
    this.emitEvent("load")
  }

  public write(wb: any, mode : "piston" | "rupture"): void {
    console.log("Microwave writing...")
    let IQ : dfd.DataFrame;
    if(this.PistonData && mode == "piston"){
      IQ = this.PistonData;
    }
    else if(this.RuptData && mode == "rupture"){
      IQ = this.RuptData;
    }
    else {
      console.log("micro波で書き込むデータがありません")
      return ;
    }

    var d : dfd.DataFrame = new dfd.DataFrame([IQ.column("t").values, IQ.column("tm").values, IQ.column("P").values, IQ.column("θ").values, 
                                               IQ.column("Δθ").values, IQ.column("Δn").values,IQ.column("n").values,
                                               IQ.column("θs").values, IQ.column("x").values ]).transpose();

    d.tail().print()
    const table1Data = [
      ["t", "t", "P",  "θ",  "Δθ", "Δn", "n", "θs", "x"],
      ["s", "ms", "V2","rad","rad","-",  "-", "rad","m"],
      ...d.values
    ];

    const ws = XLSX.utils.json_to_sheet(table1Data, {skipHeader:true})

    XLSX.utils.book_append_sheet(wb, ws, mode);
  }
}
