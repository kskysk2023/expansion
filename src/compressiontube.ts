import * as dfd from 'danfojs';
import * as XLSX from 'xlsx';

export class CompressionTube {
  senkeiKinji(x1: number, x2: number, y1: number, y2: number, x: number): number {
    const y = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
    console.log(`x1:${x1}, x2:${x2}, y1:${y1}, y2:${y2}, x:${x}, y:${y}`);
    return y;
  }
  
  senkeiKinjix(x1: number, x2: number, y1: number, y2: number, y: number): number {
    const x = ((x2 - x1) / (y2 - y1)) * (y - y1) + x1;
    console.log(`x1:${x1}, x2:${x2}, y1:${y1}, y2:${y2}, x:${x}, y:${y}`);
    return x;
  }
  private Pc: dfd.DataFrame;
  private Pmax: number;
  private Pr: number;
/*   private Pr_row: number;
  private H_end_row: number;
  private t_hold_start: number;
  private t_hold_end: number; */

  constructor(V_Pc:dfd.DataFrame) {
    this.Pc = V_Pc;
    console.log("V_Pc...");
    V_Pc.print();
    console.log("Pc... ");
    this.Pc["CH1-1[V]"].add(1.4).mul(25.482).print();
    dfd.concat({this.Pc, this.Pc["CH1-1[V]"].add(1.4).mul(25.482)})
    this.Pc.append([this.Pc["CH1-1[V]"].add(1.4).mul(25.482)], "Pc");
    console.log("Pc...." , this.Pc.print());
    
    this.Pmax = this.Pc["Pc"].max();

    const pr =  this.Pc.loc(this.Pc.ge(this.Pmax * 0.9)) //最大圧の0.9倍の圧力を探し、prとする
    this.Pr = typeof pr != "number"? 0 : pr;

/*     const hend = this.Pc.iloc([this.Pr_row]).lt(this.Pr).iat(0);
    this.H_end_row = typeof hend === "number" ? this.Pr_row + hend : this.Pr_row;

    this.t_hold_start = this.senkeiKinjix(this.Pc.index.at this.Pr_row - 1, this.Pc.index, this.Pc[this.Pr_row - 1], this.Pc[this.Pr_row], this.Pr);

    this.t_hold_end = this.senkeiKinjix(this.t[this.H_end_row - 1], this.t[this.H_end_row], this.Pc[this.H_end_row - 1], this.Pc[this.H_end_row], this.Pr);
    console.log("construct compressiontube ... "+ this.Pmax, this.Pr, this.Pr_row, this.H_end_row, this.t_hold_start, this.t_hold_end) */
  }

/*   public write(wb: any): void {
    const pcRow = "'data'!C1:'data'!C8002";
    const tRow = "'data'!A1:'data'!A8002";

    const table1Data = [
      ["t", "t", "Pc"],
      ["s", "ms", "MPa"],
      ...this.t.values.slice(0, this.Pc.count() - 1).map((_, i) => [this.t.values[i], this.t.mul(1000).values[i], this.Pc.values[i]])
    ];
    const ws = XLSX.utils.aoa_to_sheet(table1Data)

    const table2Data = [
      ["k", 1.4],
      ["D* mm", 15],
      ["Dc mm", 50],
      ["Lc m", 2],
      ["T0 K", 300],
      ["a0 m/s", "=SQRT(B1*8314.3/28.8*B5)"],
      ["aR0 m/s", "=SQRT(B1*8314.3/28.8*B5)"],
      ["alpha", "=(B2^2*B7)/(B3^2*B6)"],
      ["V0 m3", "=PI()/4*(B3*10^-3)^2*B4"],
      ["Wp kg", 0.28],
      ["omega", "=SQRT(2*(B1-1)*((B1+1)/2)^((B1+1)/(B1-1))*B16*10^3*B9/(B10*B8^2*B7^2))"],
      ["PcMax[MPa]", this.Pmax],
      ["tMax[s]", `=INDEX(${tRow}, MATCH(B12, ${pcRow}, 0))`],
      ["Pr[MPa]", this.Pr],
      ["tr[s]", "=H1"],
      ["Pc0[kPa]", "101.3"],
      ["Tr[K]", "=B5*((B16*10^3)/(B14*10^6))^((1-B1)/B1)"],
      ["ar[m/s]", "=SQRT(B1*288.68*B17)"],
      ["UR[m/s]", "=(2/(B1+1))^((B1+1)/(2*(B1-1)))*B2^2/B3^2*B18"],
      ["Holding Time[us]", "=(H2 - H1) * 10^6"]
    ];
    XLSX.utils.sheet_add_aoa(ws, table2Data)
    //CalcTable(wsC, 1, 4, table2Data).OutPut();

    const table3Data = [
      ["↓計算用", ""],
      ["maxrow", `=MATCH(B12, ${pcRow}, 0)`],
      ["=B4", 0],
      ["=B4", 30],
      [""],
      ["=H1", "=B14"],
      ["=H2", "=B14"]
    ];
    XLSX.utils.sheet_add_aoa(ws, table3Data);
    //  CalcTable(wsC, 1, 7, table3Data).OutPut();

    const table4Data = [
      ["Holding Start[s]", this.t_hold_start],
      ["Holding End[s]", this.t_hold_end]
    ];
    XLSX.utils.sheet_add_aoa(ws, table4Data);
    //CalcTable(wsC, 1, 10, table4Data).OutPut();

    const table5Data = [
      ["t0", 0],
      ["tr", "=B15"],
      ["up", "=INDEX(K:K, MATCH(N2, A:A, 1))"],
      ["beta", "=N3/B19"]
    ];
    XLSX.utils.sheet_add_aoa(ws, table5Data);
    //CalcTable(wsC, 1, 13, table5Data).OutPut();

    XLSX.utils.book_append_sheet(wb, ws, 'comp');
  } */
}