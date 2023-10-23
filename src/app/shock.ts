import * as dfd from 'danfojs';
import { ReplaySubject } from 'rxjs';
import { CHrolesP, rowData } from './funcs';

export class Shock {
    public P: dfd.DataFrame | undefined;
    data : {[key : string]: {value: number, unit : string}} = {};
    dataShock = new ReplaySubject<rowData[]>;
    
    constructor() { }

    SetData(V_P:dfd.DataFrame | undefined){
        this.P = V_P;
        if(this.P == undefined)return;
      
        //this.P.print();
        //計算が完了したことを報告
        console.log("計算完了衝撃波");
    }
    
    public getData() : rowData[]{
        const keys = Object.keys(this.data).sort();
        let sortedData: {[key : string]: {value: number, unit : string}} = {};
        for(let key of keys){
            sortedData[key] = this.data[key];
        }
        return Object.keys(sortedData).map((key) => {
            return {
            name: key,
            value: sortedData[key].value,
            unit: sortedData[key].unit,
            };
        })
    }
 
    public onPlotClick(num:number, time: number){
        //立ち上がりの時刻を代入
        const name_t = "t_P" + (num + 1).toString();
        this.data[name_t] = {value: time, unit:"s"};
        if(this.P){
            for (let index = 0; index < this.P.columns.length; index++) {
                //隣の立ち上がりが入力されていたら
                if(this.data["t_P" + (index + 2).toString()]){
                    //時間差を計算
                    const name = "Δt" + ((index + 1) * 10 + (index + 2)).toString()
                    this.data[name] = {
                    value: (this.data["t_P" + (index + 2).toString()].value - this.data["t_P" + (index + 1).toString()].value),
                    unit:"s"
                    };
                    //中圧管と低圧管の間は長さが違う
                    const name_v = "V" + ((index + 1) * 10 + (index + 2)).toString()
                    const l = (index == 1?1.17:0.5);
                    this.data[name_v] = {
                    value: l/this.data[name].value,
                    unit: "m/s"
                    };          
                }
            }
        }
        this.dataShock.next(this.getData());
        console.log("shock data...." , this.getData());
    }

    public getTP() : rowData[]{
        const r : rowData[] = [];
        this.getData().forEach((value: rowData, index) => {
            if(value.name.startsWith("t_P")){
            r.push(value);
            }
        })
        return r;
    }

    public setCalculatedData(df : dfd.DataFrame){
        const datas = dfd.toJSON(df.iloc({columns:["0:"], rows: ["0:2"] })) as rowData[];
        console.log(datas);
        const series = Object.entries(datas);
        console.log(series);
        Object.entries(datas[0]).forEach(([key, unit]) => {
            this.data[key] = {value: 0, unit : unit};
        })
        console.log(this.data);
        Object.entries(datas[1]).forEach(([key, value]) => {
            this.data[key].value = value;
        })
    }

    public write() {
        if(this.P == undefined || this.P.columns.length < 3){
            console.log("SetDataが呼ばれていない");
            return;
        }
        var d : dfd.DataFrame = this.P;
        d.addColumn("Time", this.P["t"].mul(1000), {inplace:true, atIndex:1});
        const table1Data = [
            ["Time", "Pm1", "Pm2", "Pl1", "Pl2", "Pitot"],
            ["ms",   "V", "V", "V", "V", "V"],
            ...d.values
        ];

        const f = this.getData();
        const t = [
            Object.values(f).map((value) => value.name),
            Object.values(f).map((value) => value.unit),
            Object.values(f).map((value) => value.value)
        ];
        console.log(t);
        return [table1Data, t];
    }

}