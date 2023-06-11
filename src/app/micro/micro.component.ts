import { Component } from '@angular/core';
import { MicroService } from '../micro.service';
import { CompService } from '../comp.service';
import { SettingService } from '../setting.service';

@Component({
  selector: 'app-micro',
  templateUrl: './micro.component.html',
  styleUrls: ['./micro.component.css']
})
export class MicroComponent {
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
        title: "xp, m",
        side:"right",
        range: [0, 5],
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

  constructor(public microService : MicroService, public compService : CompService, private settingService: SettingService){ }

  ngAfterViewInit(){
    this.microService.getEvent().subscribe((event) => {
      this.load();
    });
    this.compService.getEvent().subscribe((event) => {
      this.load();
    });
  }

  load(){
    if(this.compService.Pc == undefined){
      console.log("comp Pcが計算されていない")
      return;
    }
    if(this.microService.IQ == undefined){
      console.log("micro IQが計算されていない")
      return;
    }

    const t = this.compService.Pc["tm"].values;
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
        y: this.microService.IQ["x"].values,
        name:"xp",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.microService.IQ["P"].values,
        name:"power",
        mode:"lines",
        yaxis:"y3"
      },
    ];
  }
  onPlotlyClick(event : any){}
}
