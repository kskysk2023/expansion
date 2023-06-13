import { Injectable, OnInit } from '@angular/core';
import * as dfd from "danfojs";
import { Subject } from 'rxjs';
import * as XLSX from "xlsx";
@Injectable({
  providedIn: 'root'
})
export class MicroService implements OnInit {
  public IQ: dfd.DataFrame | undefined;
  public ruptIQ: dfd.DataFrame | undefined;
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
  SetData(IQ: dfd.DataFrame){
    this.IQ = IQ;
    this.IQ.print()
    const names = ["t", "I", "Q"];
    for (let index = 0; index < this.IQ.columns.length; index++) {
      this.IQ.columns[index] = names[index];
    }

    //this.IQ["時間[s]"].print()
    this.IQ.print()
    this.IQ.tail().print()
    this.num = this.IQ.shape[0];

    console.log(this.IQ.columns)

    this.IQ.print()
    this.IQ.addColumn("P", this.IQ.column("I").pow(2).add(this.IQ.column("Q").pow(2)), {inplace:true});
    
    const tt = this.IQ.column("P").loc(this.IQ["P"].ge(0.0025)).index[0]
    if(tt == undefined){
        this.tati = 0;
    }
    else{
        this.tati = tt as number;
    }
    console.log(this.IQ.column("t").iat(this.tati) as number)
    //立ち上がりをt=0にする
    this.IQ.column("t").sub(this.IQ.column("t").iat(this.tati) as number, {inplace:true});
    console.log("`始まりはt=" ,this.IQ.column("t").iat(this.tati) as number * 1000 +"ms");
    //msスケールも作る
    this.IQ.addColumn("tm", this.IQ.column("t").mul(1000), {inplace:true})

    console.log("calculating θ...")
    this.IQ.addColumn("θ", this.IQ.apply(
        (row : any) =>{
            if(typeof row[2] != "number" || typeof row[1] != "number")console.log(row, typeof row[2])
            return Math.atan2(row[2], row[1]);
        }
    ) as dfd.Series, {inplace:true});
    this.IQ["θ"].print()

    console.log("calculating Δθ...")

    var shiftarr :number[] = this.IQ["θ"].copy().values;
    shiftarr.unshift(0)
    shiftarr.pop();
    console.log(shiftarr)
    var shifted = new dfd.Series(shiftarr)
    shifted.print()
    console.log("θ...")
    this.IQ.column("θ").print()
    //this.IQ.column("θ").sub(shifted).print()
    this.IQ.addColumn("Δθ", this.IQ.column("θ").sub(shifted), {inplace:true});
    
    console.log("calculating Δn...")
    this.IQ.addColumn("Δn", this.IQ["Δθ"].apply((element: number) => {
        if (element == undefined || Math.abs(element) < 5) {
            return 0; // 最初の要素の場合は差分を計算できないのでnullを返す
        } else {
            return -element / Math.abs(element);
        }
    }) as dfd.Series, {inplace:true});

    console.log("calculating n...")
    const n : number[] = [0]
    const dn = this.IQ["Δn"].values;
    console.log(this.num)
    for(var i=1; i < this.num ; i++){
        n.push(dn[i] + n[i-1]) 
    }
    this.IQ.addColumn("n", new dfd.Series(n) as dfd.Series, {inplace:true});

    console.log("calculating ...θs")
    var thetaS : number[] = []
    const theta : number[] = this.IQ["θ"].values
    for(var i=0; i < this.num; i++){
        if(dn[i] != 0){
            thetaS.push(2.0 * n[i] * Math.PI - Math.PI);
        }else{
            thetaS.push(theta[i] + 2.0 * n[i] * Math.PI);
        }
    }
    this.IQ.addColumn("θs", new dfd.Series(thetaS) as dfd.Series, {inplace:true});
    this.IQ["θs"].sub(this.IQ["θs"].iat(this.tati), {inplace:true});//0点合わせ

    this.IQ.addColumn("x", this.IQ["θs"].mul(0.06522).div(2.0 * Math.PI), {inplace: true});

    const f = this.IQ.column("t").iat(4) as number
    if(f != undefined){
        this.ts = this.IQ.column("t").iat(5) as number - f;
    }else{
        this.ts = 0
    }
    //this.v = dfd.DataFrame(this.x).diff({ periods: 1, axis: 0 }).div(this.ts).values[0];

    this.IQ.print();

    //計算が完了したことを報告
    console.log("計算完了マイクロ波");
    this.emitEvent("load");
  }
  public setCalculatedData(df : dfd.DataFrame){
    this.IQ = df.drop({index:[0]});
    this.emitEvent("load")
  }

  public write(wb: any): void {
    if(this.IQ == undefined){
      console.log("SetDataが呼ばれていない");
      return;
    }
    console.log("Microwave writing...")

    var d : dfd.DataFrame = new dfd.DataFrame([this.IQ.column("t").values, this.IQ.column("tm").values, this.IQ.column("P").values, this.IQ.column("θ").values, 
                                               this.IQ.column("Δθ").values, this.IQ.column("Δn").values,this.IQ.column("n").values,
                                               this.IQ.column("θs").values, this.IQ.column("x").values ]).transpose();

    d.tail().print()
    const table1Data = [
      ["t", "t", "P",  "θ",  "Δθ", "Δn", "n", "θs", "x"],
      ["s", "ms", "V2","rad","rad","-",  "-", "rad","m"],
      ...d.values
    ];

    const ws = XLSX.utils.json_to_sheet(table1Data, {skipHeader:true})

    XLSX.utils.book_append_sheet(wb, ws, 'micro');
  }
}
