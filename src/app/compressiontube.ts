import { Xliff } from '@angular/compiler';
import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';

export class CompressionTube {
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
  public Pc: dfd.DataFrame;
  private Pmax: number;
  private Pr: number;
  private PrIndex: number;
  private H_end_row: number;
  private t_hold_start: number;
  private t_hold_end: number;

  constructor(V_Pc:dfd.DataFrame) {
    this.Pc = V_Pc;
    console.log("V_Pc...");
    V_Pc.print();
    console.log("Pc... ");
    this.Pc.addColumn("Pc", this.Pc["CH1-1[V]"].add(1.4).mul(25.482), {inplace:true});
    this.Pc = this.Pc.rename({"時間[s]":"t","CH1-1[V]1": "Pc"});
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
  }

  public write(wb: any): void {
    const pcRow = "'data'!C1:'data'!C8002";
    const tRow = "'data'!A1:'data'!A8002";

    const tm : dfd.Series = this.Pc["t"].mul(1000);
    var d : dfd.DataFrame = new dfd.DataFrame([this.Pc["t"].values, tm.values, this.Pc["Pc"].values]).transpose();

    d.tail().print()
    const table1Data = [
      ["t", "t", "Pc"],
      ["s", "ms", "MPa"],
      ...d.values
    ];
    const ws = XLSX.utils.json_to_sheet(table1Data, {skipHeader:true})

    const row = "B"
    const column = 1
    XLSX.utils.sheet_add_json(ws,[
      ["k", 1.67],//1
      ["kR", 1.4],
      ["T0 K", 300],
      ["Pc0[kPa]", 101.3],
      ["D* mm", 15],//5
      ["Dc mm", 50],
      ["Lc m", 2],
      ["a0 m/s", { "f": "=SQRT(F1*8314.3/4*F3)" }],
      ["aR0 m/s", { "f": "=SQRT(F2*8314.3/28.8*F3)" }],
      ["alpha", { "f": "=(F5^2*F8)/(F6^2*F9)" }],//10
      ["V0 m3", { "f": "=PI()/4*(F6*10^-3)^2*F7" }],
      ["Wp kg", 0.28],
      ["omega", { "f": "=SQRT(2*(F1-1)*((F1+1)/2)^((F1+1)/(F1-1))*F4*10^3*F11/(F12*F10^2*F9^2))" }],
      ["PcMax[MPa]", this.Pmax],
      ["tMax[s]", this.Pc["t"].iloc(this.Pc["Pc"].eq(this.Pmax)).values[0]],//15
      ["Pr[MPa]", this.Pr],
      ["tr[s]", this.t_hold_start],
      ["Tr[K]", { "f": "=F3*((F4*10^3)/(F16*10^6))^((1-F1)/F1)" }],
      ["ar[m/s]", { "f": "=SQRT(F1*8314.3/4*F18)" }],
      ["UR[m/s]", { "f": "=(2/(F1+1))^((F1+1)/(2*(F1-1)))*F5^2/F6^2*F19" }],//20
      ["holding time end[s]", this.t_hold_end],
      ["Holding Time[us]", { "f": "=(F21 - F17) * 10^6" }],
    ], {skipHeader:true, origin:"E1"});

    XLSX.utils.sheet_add_json(ws,  [
      ["up", "=INDEX(K:K, MATCH(N2, A:A, 1))"],
      ["beta", "=N3/B19"]
    ], {skipHeader:true, origin:"L1"});

    XLSX.utils.book_append_sheet(wb, ws, 'comp');
  }
}