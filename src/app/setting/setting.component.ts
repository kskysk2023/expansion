import { Component, OnInit } from '@angular/core';
import { SettingService } from '../setting.service';
import * as XLSX from 'xlsx';
import { Papa, ParseResult } from 'ngx-papaparse';
import * as dfd from 'danfojs';
import { CompService } from '../comp.service';
import { MicroService } from '../micro.service';
import { ShockService } from '../shock.service';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent implements OnInit {
  onSelectionChanged(arg0: string) {
    console.log(arg0);
  }

  constructor(private papa: Papa, public settingService : SettingService, public compService : CompService, public microService : MicroService, public shockService : ShockService){}
  ngOnInit(): void { }
  readExcelFile(file : string) {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return jsonData;
  }

  oncomplete =(results : ParseResult<any>) =>{
    if(results.errors)console.log(results.errors)
    console.log(results.data);
    const df = new dfd.DataFrame(results.data);
    //最終行に余分な公があるので削る
    df.drop({index: [df.shape[0] -1], inplace:true})
    df.print()
    //メニューにchを登録
    this.settingService.setMenuCH(df.columns);
    this.settingService.df = df;
  }
  onSelectedChanged(event : any){
    console.log(event, event.source.tabIndex)
    this.settingService.CHBind;
  }
  async ReadCsv(text: string){
    const editedtext = text.replaceAll("\+", "");
    console.log(editedtext)
    // 修正されたテキストをBlobに変換する
    this.papa.parse(new Blob([editedtext]), {
        header: true,
        dynamicTyping:true,
        worker:true,
        complete : this.oncomplete
      }
    );
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    this.settingService.setFileName(file.name);

    if(!file){
      console.log("読み込みエラー" + event.error);
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

      const jsonData = this.readExcelFile("./ShockTube結果.xlsx");
      console.log(jsonData); // 読み込んだExcelデータをコンソールに表示する例
    }
    else if (file.name.endsWith(".MEM")){
      console.log("MEMを読み込んだ" + file.name);
    }
  }
  DownloadExcel(){
    const wb = XLSX.utils.book_new();

    this.compService.write(wb);
    this.microService.write(wb);
    this.shockService.write(wb);
    const wbout = XLSX.write(wb, {bookType: "xlsx", type:"array"});
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // ダウンロード用のURLを生成
    const url = URL.createObjectURL(blob);

    // リンクを生成し、ダウンロードさせる
    const a = document.createElement('a');
    a.href = url;
    a.download = this.settingService.getOoutFileName();
    a.click();
    URL.revokeObjectURL(url);
  }
  openErrorDialog(arg0: string) {
    throw new Error('Method not implemented.');
  }
}
