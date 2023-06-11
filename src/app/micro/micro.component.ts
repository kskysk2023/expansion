import { Component } from '@angular/core';
import { MicroService } from '../micro.service';
import { CompService } from '../comp.service';
import { SettingService } from '../setting.service';
import { ShockService } from '../shock.service';

@Component({
  selector: 'app-micro',
  templateUrl: './micro.component.html',
  styleUrls: ['./micro.component.css']
})
export class MicroComponent {
  graph = {
    data : [
      { x: [0], y: [0], mode: 'scatter', yaxis:"y1" , name:"", line:{dash:'solid'}},
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
        range: [0, 20],
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
      yaxis4: {
        range: [0, 1],
        side:"left",
        visible:false,
        automargin:true,
        overlaying: 'y'
      },
      xaxis: {
        title: "time, ms",
      },
    },
    config : {
      displayModeBar: true,
      displaylogo: false,
    }
  }

  constructor(public microService : MicroService, public compService : CompService, private settingService: SettingService, private shockService : ShockService){ }

  ngAfterViewInit(){
    this.microService.getEvent().subscribe((event) => {
      this.load();
    });
    this.compService.getEvent().subscribe((event) => {
      this.load();
    });
    this.shockService.getEvent().subscribe((event) => {
      this.load();
    })
    this.shockService.getData().subscribe((event) => {
      this.load();
    })
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
    const TP = this.shockService.getTP();
    this.graph.data = [
      {
        x: t,
        y: this.compService.Pc["Pc"].values,
        name:"圧縮",
        mode:'lines',
        yaxis:"y1",
        line:{dash:"solid"}
      },
      {
        x: t,
        y: this.microService.IQ["x"].values,
        name:"xp",
        mode:"lines",
        yaxis:"y2",
        line:{dash:"solid"}
      },
      {
        x: t,
        y: this.microService.IQ["P"].values,
        name:"power",
        mode:"lines",
        yaxis:"y3",
        line:{dash:"solid"}
      },
      {
        x: [TP[0].value * 1000, TP[0].value * 1000],
        y: [-20, 20],
        name:"Med1",
        mode:"lines",
        line:{dash:"dash"},
        yaxis:"y4"
      },
      {
        x: [TP[1].value * 1000, TP[1].value * 1000],
        y: [-20, 20],
        name:"Med2",
        mode:"lines",
        line: {
          dash: 'dash' // 線を破線にする
        },
        yaxis:"y4"
      },
      {
        x: [TP[2].value * 1000, TP[2].value * 1000],
        y: [-20, 20],
        name:"Low1",
        mode:"lines",
        line: {
          dash: 'dash' // 線を破線にする
        },
        yaxis:"y4"
      },
      {
        x: [TP[3].value * 1000, TP[3].value * 1000],
        y: [-20, 20],
        name:"Low2",
        mode:"lines",
        line: {
          dash: 'dash' // 線を破線にする
        },
        yaxis:"y4"
      },
    ];
  }
  onPlotlyClick(event : any){}
}
