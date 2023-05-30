import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import * as dfd from 'danfojs';
import { Papa } from 'ngx-papaparse';

import { CompressionTube } from 'src/app/compressiontube';
import { Microwave } from './Microwave';
import { PlotlyService } from 'angular-plotly.js';
import { Shock } from './shock';
import { SettingService } from './setting.service';
import { Observable } from 'rxjs';
import { CompService } from './comp.service';
import { MicroService } from './micro.service';
import { ShockService } from './shock.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent implements OnInit{
  CHBind$ : Observable<any> | undefined ;

  graph = {
    data : [
      { x: [0], y: [0], mode: 'scatter', yaxis:"y1" ,name:""},
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

  constructor(private dialog : MatDialog, private papa: Papa, public settingService: SettingService, public compService : CompService, public microService : MicroService, public shockService : ShockService){ }
  ngOnInit(){
    this.CHBind$ = this.settingService.getCHBind();
    this.CHBind$.subscribe((value) => {
      console.log("obsever recieve")
      this.CalcData(value)});
  }

  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }
  CalcData(bind : any){
    console.log("set data")
    if(this.settingService.getDataFrame().shape[1] < 4){
      return;
    }
    this.compService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", bind.compression]}));
    this.microService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", bind.rI, bind.rQ]}));
    this.shockService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", bind.m1, bind.m2, bind.l1, bind.l2]}));
    if(this.microService.IQ == undefined || this.shockService.P == undefined|| this.compService.Pc == undefined){
      console.log("データがありません");
      return;
    }

    const new_df = this.settingService.getDataFrame().setIndex({ column: "時間[s]", drop: true }); //resets the index to Date column
    new_df.head().print() //
    const t = this.settingService.getDataFrame()["時間[s]"].values;
    this.graph.data = [
      {
        x: t,
        y: this.compService.Pc["Pc"].values,
        name:"圧縮",
        mode:'lines',
        yaxis:"y1"
      },
      {
        x: t,
        y: this.settingService.getDataFrame()[bind.m1].values,
        name:"中1",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.settingService.getDataFrame()[bind.m2].values,
        name:"中2",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.settingService.getDataFrame()[bind.l1].values,
        name:"低1",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.settingService.getDataFrame()[bind.l2].values,
        name:"低2",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.microService.IQ["P"].values,
        name:"Power",
        mode:"lines",
        yaxis:"y3"
      },
    ];

    //display test condition
    
    //display csv as table
    this.microService.IQ.plot("tableCalced").table({
    layout: {
      title:"Calc data",
      font: {family: "Times new Roman", size: 10.5, color: "#000" },
      width: 1600, height:1000}
    });
    //display csv as table
    this.settingService.getDataFrame().plot("table").table({
    layout: {
      title:"HIOKI data",
      font: {family: "Times new Roman", size: 10.5, color: "#000" },
      width: 1600, height:1000}
    });
  }
  onPlotlyClick(event :any){
    console.log(event.points[0]);
    if(1 <= event.points[0].curveNumber && event.points[0].curveNumber <= 4){
      this.shockService.onPlotClick(event.points[0]);
    }
  }
}
