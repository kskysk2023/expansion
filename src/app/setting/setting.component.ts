import { Component, OnInit } from '@angular/core';
import { SettingService } from '../setting.service';
import * as XLSX from 'xlsx';
import { Papa, ParseResult } from 'ngx-papaparse';
import * as dfd from 'danfojs';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CHroles, CHrolesC, CHrolesP, CHrolesR, CHrolesS, role, roles } from '../funcs';

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
  binds : role[]= [];
  oldBinds : role[] = [];
  CHroles = CHroles;
  
  constructor(private papa: Papa, public settingService : SettingService, private formBuilder: FormBuilder,
              private http: HttpClient){
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
  
  onSelectedChanged(index : any, isInit? : boolean) {
    let roles : roles = {compRole : [], shockRole: [], pistonRole: [], ruptRole: []};
    roles.compRole = this.binds.filter(value => CHrolesC.includes(value.role));
    roles.shockRole = this.binds.filter(value => CHrolesS.includes(value.role));
    roles.ruptRole = this.binds.filter(value => CHrolesR.includes(value.role));
    roles.pistonRole = this.binds.filter(value => CHrolesP.includes(value.role));

    //indexがどのサービスに対応するか
    console.log(this.binds, this.oldBinds, index );
    
    //サービスで各データに割り当て
    this.settingService.SetData(roles);
  }

  oncomplete =(results : ParseResult<any>) =>{
    if(results.errors)console.log(results.errors)
    //console.log(results.data);
    this.progressValue = 60;

    const df = new dfd.DataFrame(results.data);
    this.binds = [];
    //最終行に余分な公があるので削る
    df.drop({index: [df.shape[0] -1], inplace:true})
    
    //df.print()
    this.progressValue = 70;

    //メニューにchを登録
    this.CHs = Array.from(df.columns);
    this.CHs.splice(this.CHs.indexOf("時間[s]"), 1);

    this.CHs.forEach((value, index) => {
      let role = "×"
      if(index < CHroles.length){
        role = CHroles[index];
      }
      this.binds.push({name: value, role});
      this.oldBinds.push({name: value, role});
    });

    //setするとイベントが送信される
    this.settingService.setDataFrame(df);
    
    //dfの割り当て
    this.onSelectedChanged(1, true);

    //ガスと圧力をShockTube結果から読み込む　＊いつか作る
    /*
    const bind = this.settingService.getResult();
    if(bind != undefined){
      this.compService.data = bind;

      this.compService.emitEvent("setBindGas")
      this.compService.calc();
    }
     */

    this.progressValue = 80;
        
    //読み込み終わったら進捗を100％にする
    this.progressValue = 100;
  }

  async ReadCsv(text: string){
    const editedtext = text.replaceAll("\+", "");
    //console.log(editedtext);
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
/* 
          switch (sheetName) {
            case "comp":
              const t = sheetData["t"] as dfd.Series;
              this.settingService.setTime(t.iloc(["1:"]).asType('float32'));
              this.compService.setCalculatedData(sheetData);
              break;
            case "piston":
              this.pistonService.setCalculatedData(sheetData);
              break;
            case "rupture":
              this.ruptureService.setCalculatedData(sheetData);
              break;    
            case "shock":
              this.shockService.setCalculatedData(sheetData);
              break;
            default:
              break;
          }
           */
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  DownloadExcel(event : Event){
    const wb = XLSX.utils.book_new();

    this.settingService.write(wb);

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
