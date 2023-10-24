import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ReplaySubject } from 'rxjs';
import { SettingService } from '../setting.service';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { Papa } from 'ngx-papaparse';
import { rowData } from '../funcs';
import { Comp } from '../comp';
import { Shock } from '../shock';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit{
  displayedColumns: string[] = ['name', 'value', 'unit'];
  dataComp = new ReplaySubject<rowData[]>;
  comp : Comp;
  shock : Shock;

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
      yaxis: {
        title: "PCB Voltage, V",
        side:"left",
        range:[-200e-3, 500e-3]
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
  constructor(private dialog : MatDialog, private papa: Papa, public settingService: SettingService){
    this.comp = this.settingService.comp;
    this.shock = this.settingService.shock;
  }
  ngOnInit(){
    this.settingService.getEvent().subscribe((value) => {
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

    const t = this.settingService.getTime().values as number[];

    //reset
    this.graph.data = [{ x: [] as number[], y: [] as number[], mode: 'scatter', yaxis:"y1" ,name:""}];

    if(this.shock.P){
      const cols = this.shock.P.columns;
      console.log("PCBのセンサは", cols.length - 1, "個ある");
    
      cols.forEach((colname : string, index : number) => {
        if(index == 0){return;}
        if(this.shock.P){
          this.graph.data.push({
            x: t,
            //上下にずらして表示するためオフセットを加算 10e-3Vずづずらす
            y: this.shock.P.column(colname).add(100e-3 * (index - 1)).values as number[],
            name:colname,
            mode:"lines",
            yaxis:"y1"
          });
        }
      });
    }
  }

  onPlotlyClick(event :any){
    console.log(event.points[0].data.name)
    const shocks = this.shock.P?.columns;
    const plotnum = shocks?.findIndex((v) => v === event.points[0].data.name);
    if(plotnum != -1 && plotnum){
      //時間の列を除くために-1
      console.log(event.points[0].x)
      this.shock.onPlotClick(plotnum -1, event.points[0].x);
    }
  }
}
