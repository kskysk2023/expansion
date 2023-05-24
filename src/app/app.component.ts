import { Component } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog/error-dialog.component';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private dialog : MatDialog){}
  title = 'expansion';
  openErrorDialog(errorMessage: string): void{
    const dialogRef = this.dialog.open(ErrorDialogComponent, {
      width: '400px',
      data: errorMessage 
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const reader: FileReader = new FileReader();
  
    reader.onload = (e: any) => {
      const fileContent = e.target.result;
      if(!fileContent || !(e.target instanceof HTMLInputElement)){
        console.log("読み込みエラー");
        this.openErrorDialog("読み込みエラー");
      }

      if(file.name.endsWith(".csv")){
        console.log("csvを読み込んだ" + file.name);
      }
      else if (file.name.endsWith(".MEM")){
        console.log("MEMを読み込んだ" + file.name);
      }
    };
    reader.readAsText(file);
  }
  
}
