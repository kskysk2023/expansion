import { Component } from '@angular/core';
import { SettingService } from '../setting.service';
import { rowData } from '../funcs';
import { Micro } from '../Micro';

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
  piston : Micro;
  rupt : Micro;

  constructor(private settingService: SettingService){
    this.piston = settingService.piston;
    this.rupt = settingService.rupt;
  }

  ngAfterViewInit(){
    this.settingService.getEvent().subscribe((event) => {
      this.load();
    });
  }

  load(){
    //this.settingService.getTime().print();
    const t = this.settingService.getTime().mul(1000).values as number[];
    console.log(t[0])
    
    //reset
    this.graph.data = [{ x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" ,name:"", line : {dash:"solid"}}];

    if(this.settingService.comp.Pc){
      this.graph.data.push({
          x: t,
          y: this.settingService.comp.Pc["Pc"].values,
          name:"圧縮",
          mode:'lines',
          yaxis:"y1",
          line:{dash:"solid"}
      });
    }
    if(this.piston.df){
      this.graph.data.push({
        x: t,
        y: this.piston.df["x"].values,
        name:"xp",
        mode:"lines",
        yaxis:"y2",
        line:{dash:"solid"}
      });
    }
    if(this.rupt.df){
      this.graph.data.push({
        x: t,
        y: this.rupt.df["x"].values,
        name:"xr",
        mode:"lines",
        yaxis:"y2",
        line:{dash:"solid"}
      });
    }    

    const TP = this.settingService.shock.getTP();
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
