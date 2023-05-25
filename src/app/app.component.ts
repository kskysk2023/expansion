import { Component, OnInit } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { DialogRef } from '@angular/cdk/dialog';
import * as dfd from 'danfojs';
import { CsvInputOptionsBrowser } from 'danfojs-node/dist/danfojs-base/shared/types';
import { ParseConfig } from 'papaparse';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  constructor(private dialog : MatDialog){}
  title = 'expansion';
  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }

  public ngOnInit()
  {

  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const fileContent = e.target.result;
      if(!fileContent){
        console.log("読み込みエラー" + e);
        this.openErrorDialog("読み込みエラー");
      }

      if(file.name.endsWith(".csv")){
        console.log("csvを読み込んだ" + file.name);
        this.ReadCsv(file);
      }
      else if (file.name.endsWith(".MEM")){
        console.log("MEMを読み込んだ" + file.name);
      }
    };
    reader.readAsText(file);
  }

  ReadCsv(csvfile: File){
    dfd.readCSV(csvfile)
    .then(df => {
        console.log("read")
        df.plot("div1").table() //display csv as table

        const new_df = df.setIndex({ column: "時間[s]", drop: true }); //resets the index to Date column
        new_df.head().print() //
        new_df.plot("div2").line({
            config: {
                columns: ["CH1-1[V]", "CH2-1[V]", "CH3-1[V]"]
            }
        })  //makes a timeseries plot

    }).catch(err => {
        console.log(err);
    })
  }
}
