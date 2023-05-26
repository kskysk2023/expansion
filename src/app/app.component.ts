import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import * as dfd from 'danfojs';
import { Papa, ParseResult } from 'ngx-papaparse';
import * as XLSX from 'xlsx';
import { CompressionTube } from 'src/compressiontube';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent{
  constructor(private dialog : MatDialog, private papa: Papa){  }
  title = 'expansion';
  public df : dfd.DataFrame = new dfd.DataFrame;

  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if(!file){
      console.log("読み込みエラー" + event.error);
      this.openErrorDialog("読み込みエラー");
    }

    if(file.name.endsWith(".csv")){
      console.log("csvを読み込んだ" + file.name);
      this.ReadCsv(file)
    }
    else if (file.name.endsWith(".MEM")){
      console.log("MEMを読み込んだ" + file.name);
    }

  }

  oncomplete =(results : ParseResult<any>, file? : File) =>{
    console.log(results.data);
    this.df = new dfd.DataFrame(results.data);

    const wb = XLSX.utils.book_new();

    new CompressionTube(this.df.loc({columns: ["時間[s]", "CH1-1[V]"]}));
    XLSX.writeFile(wb, "SheetJSESMTest.xlsx");
    const layout = {
      font: { family: "Times new Roman", size: 20, color: "#000" },
      title: {
        text: "Time series plot of Compression tube pressure and PCB sensors",
        x: 0,
      },
      legend: {
        bgcolor: "#ffffff",
        bordercolor: "#444",
        borderwidth: 1,
        font: { family: "Times new Roman", size: 10, color: "#000" },
      },
      width: 1600,
      yaxis: {
        title: "Voltage, V",
      },
      xaxis: {
        title: "time, s",
      },
    };
      
    const config = {
      columns: ["CH1-1[V]", "CH2-1[V]", "CH3-1[V]", "CH4-1[V]", "CH5-1[V]"],
      displayModeBar: true,
      displaylogo: false,
    };
    this.df.plot("table").table() //display csv as table

    const new_df = this.df.setIndex({ column: "時間[s]", drop: true }); //resets the index to Date column
    new_df.head().print() //
    new_df.plot("pressureChart").line({config: config, layout: layout});
  }

  ReadCsv(file: any){
    this.papa.parse(file, {
        encoding:'Shift-JIS',
        header: true,
        dynamicTyping:true,
        complete : this.oncomplete
      }
    );
  }
}
