import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import * as dfd from 'danfojs';
import { Papa, ParseResult } from 'ngx-papaparse';
import * as XLSX from 'xlsx';
import { CompressionTube } from 'src/compressiontube';
import { Microwave } from './Microwave';
import { PlotlyService } from 'angular-plotly.js';
import { Shock } from './shock';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})

export class AppComponent{
  public df : dfd.DataFrame = new dfd.DataFrame;
  public shock : Shock | undefined = undefined;
  public micro : Microwave | undefined = undefined;
  public comp : CompressionTube | undefined = undefined;
  public filename = ""
  public CHs :string[] = [];
  pressureSelected = {compression: "CH1-1[V]", m1:"CH2-1[V]", m2:"CH3-1[V]", l1:"CH4-1[V]",l2:"CH5-1[V]"};
  microSelected = {pI:"CH6-1[V]",pQ:"CH6-2[V]",rI:"CH7-1[V]",rQ:"CH7-2[V]"};

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

  constructor(private dialog : MatDialog, private papa: Papa, private plotlyService : PlotlyService){
    const Plotly = plotlyService.getPlotly();
  }

  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }

  onSelectionChanged(event: any){
    this.comp = new CompressionTube(this.df.loc({columns: ["時間[s]", this.pressureSelected.compression]}));
    this.micro = new Microwave(this.df.loc({columns: ["時間[s]", this.microSelected.rI, this.microSelected.rQ]}));
    this.shock = new Shock(this.df.loc({columns: ["時間[s]", this.pressureSelected.m1, this.pressureSelected.m2, this.pressureSelected.l1, this.pressureSelected.l2]}));

    const new_df = this.df.setIndex({ column: "時間[s]", drop: true }); //resets the index to Date column
    new_df.head().print() //
    const t = this.df["時間[s]"].values;
    this.graph.data = [
      {
        x: t,
        y: this.comp.Pc["Pc"].values,
        name:"圧縮",
        mode:'lines',
        yaxis:"y1"
      },
      {
        x: t,
        y: this.df[this.pressureSelected.m1].values,
        name:"中1",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.df[this.pressureSelected.m2].values,
        name:"中2",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.df[this.pressureSelected.l1].values,
        name:"低1",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.df[this.pressureSelected.l2].values,
        name:"低2",
        mode:"lines",
        yaxis:"y2"
      },
      {
        x: t,
        y: this.micro.IQ["P"].values,
        name:"Power",
        mode:"lines",
        yaxis:"y3"
      },
    ];

    //display csv as table
    this.micro.IQ.plot("tableCalced").table({
    layout: {
      title:"Calc data",
      font: {family: "Times new Roman", size: 10.5, color: "#000" },
      width: 1600, height:1000}
    });
    //display csv as table
    this.df.plot("table").table({
    layout: {
      title:"HIOKI data",
      font: {family: "Times new Roman", size: 10.5, color: "#000" },
      width: 1600, height:1000}
    });
  }
  readExcelFile(file : string) {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return jsonData;
  }
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.filename = file.name;

    if(!file){
      console.log("読み込みエラー" + event.error);
      this.openErrorDialog("読み込みエラー");
    }

    if(file.name.endsWith(".csv")){
      console.log("csvを読み込んだ" + file.name);
      const reader = new FileReader();
      let text ="";
      reader.onload = (ev) => {
        text = ev.target?.result as string; 
        this.ReadCsv(text);
      }
      reader.readAsText(file, "Shift-JIS");
      const nameparts = file.name.split("_");
      const excelPartName = "20" + nameparts[1].slice(0, 2) + "_" + nameparts[1].slice(2) + "_" + nameparts[0].slice(0, 4);
      console.log(excelPartName);

      const jsonData = this.readExcelFile("./ShockTube結果.xlsx");
      console.log(jsonData); // 読み込んだExcelデータをコンソールに表示する例
    }
    else if (file.name.endsWith(".MEM")){
      console.log("MEMを読み込んだ" + file.name);
    }
  }

  oncomplete =(results : ParseResult<any>) =>{
    if(results.errors)console.log(results.errors)
    console.log(results.data);
    this.df = new dfd.DataFrame(results.data);
    //最終行に余分な公があるので削る
    this.df.drop({index: [this.df.shape[0] -1], inplace:true})
    
    //メニューにchを登録
    this.CHs=this.df.columns;
    this.onSelectionChanged("");
  }
  DownloadExcel(){
    const wb = XLSX.utils.book_new();
    if(this.comp == undefined || this.micro == undefined || this.shock == undefined){
      this.openErrorDialog("衝撃波速度を計算してください");
      return;
    }
    this.comp.write(wb);
    this.micro.write(wb);
    this.shock.write(wb);
    const wbout = XLSX.write(wb, {bookType: "xlsx", type:"array"});
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // ダウンロード用のURLを生成
    const url = URL.createObjectURL(blob);

    // リンクを生成し、ダウンロードさせる
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename.slice(0, -11) + ".xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }
  async ReadCsv(text: string){
    console.log(text)
    const editedtext = text.replaceAll("\+", "");
    // 修正されたテキストをBlobに変換する
    this.papa.parse(new Blob([editedtext]), {
        header: true,
        dynamicTyping:true,
        worker:true,
        complete : this.oncomplete
      }
    );
  }
  onPlotlyClick(event :any){
    console.log(event.points[0]);
    if(1 <= event.points[0].curveNumber && event.points[0].curveNumber <= 4){
      this.shock?.onPlotClick(event.points[0]);
    }
  }
}
