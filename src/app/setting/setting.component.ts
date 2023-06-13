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
  shock: { [key: string]: string },
  //shock : {m1: string, m2: string, l1: string, l2: string},
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

  onSelectedChanged() {
    const compression = this.bind.compression;
    const shock = Object.values(this.bind.shock).filter(value => value && value !== "×");
    const rupture = Object.values(this.bind.rupture).filter(value => value && value !== "×");
    const piston = Object.values(this.bind.piston).filter(value => value && value !== "×");
  
    if (compression !== undefined) {
      this.compService.SetData(this.settingService.getDataFrame().loc({ columns: ["時間[s]", compression] }));
    }
    if (shock.length > 1) {
      this.shockService.SetData(this.settingService.getDataFrame().loc({ columns: ["時間[s]", ...shock] }));
    }
    if (rupture.length > 1) {
      this.microService.SetData(this.settingService.getDataFrame().loc({ columns: ["時間[s]", ...rupture] }), "rupture");
    }
    if (piston.length > 1) {
      this.microService.SetData(this.settingService.getDataFrame().loc({ columns: ["時間[s]", ...piston] }), "piston");
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

    const properties = ['m1', 'm2', 'l1', 'l2']; // `shock` オブジェクトのプロパティ名のリスト
    this.bind.compression = this.CHs[1];
    console.log(this.CHs)
    for (let i = 2; i < this.CHs.length - 1; i++) {
      const ch = this.CHs[i];

      if (i <= 5) {
        const property = properties[i - 2];
        this.bind.shock[property] = ch;
      } else if (i <= 7) {
        const property = i === 6 ? 'I' : 'Q';
        this.bind.piston[property] = ch;
      } else if (i <= 9) {
        const property = i === 8 ? 'I' : 'Q';
        this.bind.rupture[property] = ch;
      }
    }

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
    else if (file.name.endsWith(".xlsx")) {
      console.log("xlsxを選んだ");
    
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array((event.target as FileReader).result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetNames = wb.SheetNames;
    
        const readSheetPromises = sheetNames.map((sheetName) => {
          return dfd.readExcel(file, { sheet: wb.SheetNames.indexOf(sheetName) });
        });
    
        const sheetDataList = await Promise.all(readSheetPromises);
    
        for (let i = 0; i < sheetDataList.length; i++) {
          const sheetData = sheetDataList[i] as dfd.DataFrame;
          const sheetName = sheetNames[i];
    
          console.log(sheetName);
          switch (sheetName) {
            case "comp":
              const t = sheetData["t"] as dfd.Series;
              this.settingService.setTime(t.iloc(["1:"]).asType('float32'));
              this.compService.setCalculatedData(sheetData);
              break;
            case "piston":
              this.microService.setCalculatedData(sheetData, "piston");
              break;
            case "rupture":
              this.microService.setCalculatedData(sheetData, "rupture")
              break;    
            case "shock":
              this.shockService.setCalculatedData(sheetData);
              break;
            default:
              break;
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  DownloadExcel(event : Event){
    const wb = XLSX.utils.book_new();

    this.compService.write(wb);
    this.microService.write(wb, "piston");
    this.microService.write(wb, "rupture");
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
