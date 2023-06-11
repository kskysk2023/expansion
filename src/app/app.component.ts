import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { Papa } from 'ngx-papaparse';
import { SettingService } from './setting.service';
import { Observable, ReplaySubject } from 'rxjs';
import { CompService } from './comp.service';
import { MicroService } from './micro.service';
import { ShockService } from './shock.service';
import { ArrayType1D } from 'danfojs/dist/danfojs-base/shared/types';
export interface rowData {
  name : string;
  value : number;
  unit : string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  dataComp = new ReplaySubject<rowData[]>;

  graph = {
    data : [
      { x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" ,name:""},
    ],
    layout : {
      font: { family: "Times new Roman", size: 16, color: "#000" },
      legend: {
        x:1.08,
        bgcolor: "#ffffff",
        bordercolor: "#444",
        borderwidth:1,
        font: { family: "Times new Roman", size: 10, color: "#000" },
      },
      height:600,
      width:1400,
      yaxis:{
        title: "Compression Tube Pressure, MPa",
      },
      yaxis2: {
        title: "PCB Voltage, V",
        side:"right",
        overlaying: 'y' // 重ねて表示するために追加
      },
      yaxis3: {
        title: "Power, V2",
        color:"#abc",
        automargin: true,
        range: [0, 3e-4],
        position:0.9,
        gridcolor:"#abc",
        side:"right",
        overlaying: 'y' // 重ねて表示するために追加
      },
      xaxis: {
        title: "time, s",
      },
    },
    config : {
      displayModeBar: true,
      displaylogo: false,
    }
  }

  constructor(private dialog : MatDialog, private papa: Papa, public settingService: SettingService,
              public compService : CompService, public microService : MicroService, public shockService : ShockService){
  }
  ngOnInit(){
    this.shockService.getEvent().subscribe((value) => {
      this.CalcData();
    });
    this.compService.getEvent().subscribe((value) => {
      this.CalcData();
    });
    this.microService.getEvent().subscribe((value) => {
      this.CalcData();
    });
  }

  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }
  CalcData(){
    console.log("set data")

    const new_df = this.settingService.getDataFrame() //resets the index to Date column
    new_df.head().print() //
    const t = this.settingService.getTime().values as number[];

    //reset
    this.graph.data = [{ x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" ,name:""}];

    if(this.compService.Pc){
      console.log("圧縮管のデータがある");
      this.graph.data.push({
        x: t,
        y: this.compService.Pc["Pc"].values,
        name:"圧縮",
        mode:'lines',
        yaxis:"y1"
      });
    }
    if(this.shockService.P){
      const cols = this.shockService.P.columns;
      console.log("PCBのセンサは", cols.length - 1, "個ある");
    
      cols.forEach((colname : string, index : number) => {
        if(index == 0){return;}
        if(this.shockService.P){
          this.graph.data.push({
            x: t,
            y: this.shockService.P.column(colname).values as number[],
            name:colname,
            mode:"lines",
            yaxis:"y2"
          });
        }
      });
    }
    if(this.microService.IQ){
      console.log("圧縮管のデータがある");
      this.graph.data.push({
        x: t,
        y: this.microService.IQ["P"].values,
        name:"Power",
        mode:"lines",
        yaxis:"y3"
      });
    }

  }

  onPlotlyClick(event :any){
    console.log(event.points[0].data.name)
    const shocks = this.shockService.P?.columns;
    const plotnum = shocks?.findIndex((v) => v === event.points[0].data.name);
    if(plotnum != -1 && plotnum){
      //時間の列を除くために-1
      console.log(event.points[0].x)
      this.shockService.onPlotClick(plotnum -1, event.points[0].x);
    }
  }
}
