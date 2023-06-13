import { Component, OnInit } from '@angular/core';
import { SettingService } from '../setting.service';
import * as XLSX from 'xlsx';
import { Papa, ParseResult } from 'ngx-papaparse';
import * as dfd from 'danfojs';
import { CompService, getKappaM, getNameFromM } from '../comp.service';
import { MicroService } from '../micro.service';
import { ShockService } from '../shock.service';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
export interface Bind {
  compression: string,
  shock : {m1: string, m2: string, l1: string, l2: string},
  piston : {I:string, Q: string},
  rupture : {I: string, Q: string}
}

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css'],
})
export class SettingComponent implements OnInit {
  [x: string]: any;
  progressValue=0;
  stepOneForm = this.formBuilder.group({
    firstCtrl: ['', Validators.required]
  });
  public CHs :string[] = [];
  bind :Bind = {
    compression: "CH1-1[V]",
    shock :{m1: "×", m2: "×", l1: "×", l2: "×"},
    piston : {I: "×", Q: "×"},
    rupture : {I: "×", Q: "×"}
  }

  constructor(private papa: Papa, public settingService : SettingService, public compService : CompService, private formBuilder: FormBuilder,
              public microService : MicroService, public shockService : ShockService, private http: HttpClient){

  }
  ngOnInit(): void {
    this.readExcelFile("ShockTube.xlsx");
  }

  readExcelFile(file : string) {
    const url = `assets/${file}`; // ShockTube.xlsxのパスを指定

    this.http.get(url, { responseType: 'blob' }).subscribe(response => {
      const fileBlob = response as Blob;
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const data = new Uint8Array(fileReader.result as ArrayBuffer);
        const wbresult = XLSX.read(data, { type: 'array' });
        const sheetName = wbresult.SheetNames[0];
        const wsresult = wbresult.Sheets[sheetName];
        this.settingService.setExcelResult(wbresult, wsresult);
      };
      fileReader.readAsArrayBuffer(fileBlob);
    });
  }

  onSelectedChanged(){
    if(this.bind.compression != undefined){
      this.compService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", this.bind.compression]}));
    }
    if(this.bind.shock){
      const co:string[] = [];
      Object.values(this.bind.shock).forEach((value) => {
        if(value && value != "×"){
          co.push(value);
        }
      });
      if(co.length > 1){
        this.shockService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", ...co]}));
      }
    }
    if(this.bind.rupture){
      const co:string[] = [];
      Object.values(this.bind.rupture).forEach((value) => {
        if(value && value != "×"){
          co.push(value);
        }
      });
      if(co.length > 1){
        this.microService.SetData(this.settingService.getDataFrame().loc({columns: ["時間[s]", ...co]}));
      }
    }
  }

  oncomplete =(results : ParseResult<any>) =>{
    if(results.errors)console.log(results.errors)
    console.log(results.data);
    this.progressValue = 60;

    const df = new dfd.DataFrame(results.data);
    //最終行に余分な公があるので削る
    df.drop({index: [df.shape[0] -1], inplace:true})
    
    df.print()
    this.progressValue = 70;

    //メニューにchを登録
    this.CHs = df.columns;
    this.CHs.push("×")

    //setするとイベントが送信される
    this.settingService.setDataFrame(df);
    
    //dfの割り当て
    this.onSelectedChanged();

    //ガスと圧力をShockTube結果から読み込む
    const bind = this.settingService.getResult();
    if(bind != undefined){
      this.compService.data["kR"] = {value : getKappaM(getNameFromM(bind.R)).kappa, unit:"-"};
      this.compService.data["kC"] = {value : getKappaM(getNameFromM(bind.C)).kappa, unit:"-"};
      this.compService.data["kM"] = {value : getKappaM(getNameFromM(bind.M)).kappa, unit : "-"}
      this.compService.data["kL"] = {value : getKappaM(getNameFromM(bind.L)).kappa, unit : "-"};

      this.compService.data["MR"] = {value : bind.R, unit:"-"};
      this.compService.data["MC"] = {value : bind.C, unit:"-"};
      this.compService.data["MM"] = {value : bind.M, unit : "-"}
      this.compService.data["ML"] = {value : bind.L, unit : "-"};

      this.compService.data["Dth"] = {value : bind.Dth, unit : "mm"};
      this.compService.data["T0"] = {value : bind.T0, unit : "K"};
      this.compService.data["Wp"] = {value : bind.Wp, unit : "kg"};
      this.compService.data["groove"] = {value : bind.groove, unit: "mm"};

      this.compService.data["PR0"] = {value : bind.PR0, unit:"MPa"};
      this.compService.data["PC0"] = {value : bind.PC0, unit:"kPa"};
      this.compService.data["PM0"] = {value : bind.PM0, unit : "kPa"}
      this.compService.data["PL0"] = {value : bind.PL0, unit : "Pa"};

      this.compService.emitEvent("setBindGas")
      this.compService.calc();
    }

    this.progressValue = 80;
        
    //読み込み終わったら進捗を100％にする
    this.progressValue = 100;
  }

  async ReadCsv(text: string){
    const editedtext = text.replaceAll("\+", "");
    console.log(editedtext);
    this.progressValue = 40;

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
    //まずプログレスバーを動かす
    console.log("ファイルが選択された");
    this.progressValue = 1;

    const file: File = event.target.files[0];
    this.settingService.setFileName(file.name);

    if(!file){
      console.log("読み込みエラー" + event.error);
    }

    if(file.name.endsWith(".csv")){
      console.log("csvを読み込んだ" + file.name);
      this.progressValue = 20;

      const reader = new FileReader();
      let text ="";
      reader.onload = (ev) => {
        text = ev.target?.result as string; 
        this.ReadCsv(text);
      }
      reader.readAsText(file, "Shift-JIS");

    }
    else if (file.name.endsWith(".MEM")){
      console.log("MEMを読み込んだ" + file.name);
    }
    else if(file.name.endsWith(".xlsx")){
      console.log("xlsxを選んだ");

      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array((event.target as FileReader).result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        dfd.readExcel(file, {sheet: wb.SheetNames.indexOf("comp")}).then((value) => {
          console.log("comp")
          const df = value as dfd.DataFrame;
          const t = df["t"] as dfd.Series;
          this.settingService.setTime(t.iloc(["1:"]).asType('float32'));
          this.compService.setCalculatedData(df);
        });
        dfd.readExcel(file, {sheet: wb.SheetNames.indexOf("micro")}).then((value) => {
          console.log("micro")
          const df = value as dfd.DataFrame;
          this.microService.setCalculatedData(df);
        });
        dfd.readExcel(file, {sheet: wb.SheetNames.indexOf("shock")}).then((value) => {
          console.log("shock")
          const df = value as dfd.DataFrame;
          this.shockService.setCalculatedData(df);
        });    
      };
      reader.readAsArrayBuffer(file);
    }
  }

  DownloadExcel(event : Event){
    const wb = XLSX.utils.book_new();

    this.compService.write(wb);
    this.microService.write(wb);
    this.shockService.write(wb);
    const wbout = XLSX.write(wb, {bookType: "xlsx", type:"array"});
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // ダウンロード用のURLを生成
    const url = URL.createObjectURL(blob);

    // リンクを生成し、ダウンロードさせる
    event.preventDefault();
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
