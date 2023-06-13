import { Component } from '@angular/core';
import { MicroService } from '../micro.service';
import { CompService } from '../comp.service';
import { SettingService } from '../setting.service';
import { ShockService } from '../shock.service';
import { rowData } from '../app.component';

@Component({
  selector: 'app-micro',
  templateUrl: './micro.component.html',
  styleUrls: ['./micro.component.css']
})
export class MicroComponent {
  graph = {
    data : [
      { x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" , name:"", line:{dash:'solid'}},
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
    this.shockService.getDataSource().subscribe((event) => {
      this.load();
    })
  }

  load(){
    this.settingService.getTime().print();
    const t = this.settingService.getTime().mul(1000).values as number[];
    console.log(t[0])
    
    //reset
    this.graph.data = [{ x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" ,name:"", line : {dash:"solid"}}];

    if(this.compService.Pc){
      this.graph.data.push({
          x: t,
          y: this.compService.Pc["Pc"].values,
          name:"圧縮",
          mode:'lines',
          yaxis:"y1",
          line:{dash:"solid"}
      });
    }
    if(this.microService.PistonData){
      this.graph.data.push({
        x: t,
        y: this.microService.PistonData["x"].values,
        name:"xp",
        mode:"lines",
        yaxis:"y2",
        line:{dash:"solid"}
      },      {
        x: t,
        y: this.microService.PistonData["P"].values,
        name:"power_p",
        mode:"lines",
        yaxis:"y3",
        line:{dash:"solid"}
      });
    }
    if(this.microService.RuptData){
      this.graph.data.push({
        x: t,
        y: this.microService.RuptData["x"].values,
        name:"xr",
        mode:"lines",
        yaxis:"y2",
        line:{dash:"solid"}
      },      {
        x: t,
        y: this.microService.RuptData["P"].values,
        name:"power_r",
        mode:"lines",
        yaxis:"y3",
        line:{dash:"solid"}
      });
    }    

    const TP = this.shockService.getTP();
    TP.forEach((value : rowData, index) => {
      let name = index < 2?"Low":"Med";
      name = name + ((index % 2) + 1).toString();
      this.graph.data.push({
        x: [value.value * 1000, value.value * 1000],
        y: [-20, 20],
        name,
        mode:"lines",
        line: {
          dash: 'dash' // 線を破線にする
        },
        yaxis:"y4"
      });
    })
  }
  onPlotlyClick(event : any){}
}
