import * as dfd from "danfojs";
export class Micro{
    public df: dfd.DataFrame | undefined;
    private num: number | undefined;
    private ts: number | undefined;

    constructor(){}
    
    SetData(IQ: dfd.DataFrame | undefined, lambda_g : number) {
        this.df = IQ; // this.data を data に置き換え
        if(this.df == undefined)return;
        
        console.log("Micro calc...")

        this.df.columns[1] = "I";
        this.df.columns[2] = "Q";
        
        this.num = this.df.shape[0];
      
        //console.log(this.df.columns);
     
        this.df.addColumn("P", this.df.column("I").pow(2).add(this.df.column("Q").pow(2)), { inplace: true });
      
        console.log("calculating θ...");
        this.df.addColumn("θ", this.df.loc({columns: ['I', 'Q']}).apply((row : any) => Math.atan2(row[1], row[0])) as dfd.Series, { inplace: true });
        //this.df["θ"].print();
      
        console.log("calculating Δθ...");
      
        var shiftarr: number[] = this.df["θ"].copy().values;
        shiftarr.unshift(0);
        shiftarr.pop();
        var shifted = new dfd.Series(shiftarr);
        //shifted.print();
        
        console.log("θ...");
        //this.df.column("θ").print();
        this.df.addColumn("Δθ", this.df.column("θ").sub(shifted), { inplace: true });
      
        console.log("calculating Δn...");
        this.df.addColumn("Δn", this.df["Δθ"].apply((element: number) => {
          if (element == undefined || Math.abs(element) < 5) {
            return 0; // 最初の要素の場合は差分を計算できないのでnullを返す
          } else {
            return -element / Math.abs(element);
          }
        }) as dfd.Series, { inplace: true });
      
        console.log("calculating n...");
        const n: number[] = [0];
        const dn = this.df["Δn"].values;
        console.log(this.num);
        for (var i = 1; i < this.num; i++) {
          n.push(dn[i] + n[i - 1]);
        }
        this.df.addColumn("n", new dfd.Series(n) as dfd.Series, { inplace: true });
      
        console.log("calculating ...θs");
        var thetaS: number[] = [];
        const theta: number[] = this.df["θ"].values;
        for (var i = 0; i < this.num; i++) {
          if (dn[i] != 0) {
            thetaS.push(2.0 * n[i] * Math.PI - Math.PI);
          } else {
            thetaS.push(theta[i] + 2.0 * n[i] * Math.PI);
          }
        }
        this.df.addColumn("θs", new dfd.Series(thetaS) as dfd.Series, { inplace: true });
      
        this.df.addColumn("x", this.df["θs"].mul(lambda_g).div(2.0 * Math.PI), { inplace: true });
    
        //0点合わせを計算
        //t=0の行を取得する
        const t0row = this.df.column("t").eq(0).index[0] as number;
        console.log("`始まりはt=", this.df.column("t").iat(t0row) + "ms");
        this.df.column("t").sub(this.df.column("t").iat(t0row) as number, { inplace: true });
        this.df.column("θs").sub(this.df.column("θs").iat(t0row) as number, {inplace: true});
    
        //msスケールも作る
        this.df.addColumn("tm", this.df.column("t").mul(1000), { inplace: true });
      
        //Δtの計算
        this.ts = (this.df.column("t").iat(5) as number) - (this.df.column("t").iat(4) as number);
        
        //vの計算
        //data["v"] = data["x"].diff({ periods: 1, axis: 0 }).div(this.ts).values[0];
      
        //this.df.print();
      
        //計算が完了したことを報告
        console.log("計算完了マイクロ波");
      }

      write(){
        if(this.df == undefined){
            console.log("micro波で書き込むデータがありません")
            return ;
          }

        //デバック用    
        var d : dfd.DataFrame = new dfd.DataFrame([this.df.column("tm").values, this.df.column("I").values, this.df.column("Q").values,
                                                this.df.column("P").values, this.df.column("θ").values,
                                                this.df.column("Δθ").values, this.df.column("Δn").values, 
                                                this.df.column("θs").values, this.df.column("x").values ]).transpose();
        //d.tail().print()
        const table1Data = [
        ["Time", "I", "Q", "P",  "Ψ",  "ΔΨ",  "dn",  "θ", "x"],
        ["ms",   "V", "V", "V2", "rad","rad", "rad", "-", "m"],
        ...d.values
        ];

        return table1Data;
      }
}
