import { Injectable } from '@angular/core';
import { of } from 'rxjs/internal/observable/of';
import * as dfd from 'danfojs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private CHBindSubject = new BehaviorSubject<any>({});

  CHBind$ = this.CHBindSubject.asObservable();

  filename = "";
  excelPartName = "";
  public CHs :string[] = [];
  df : dfd.DataFrame = new dfd.DataFrame;

  constructor() { }
  getDataFrame(){return this.df;}

  updateCHBindProperty(bind: any) {
    this.CHBindSubject.next(bind);
  }
  getCHBind() {return this.CHBind$;}
  getCH(){return this.CHBindSubject.value;}

  getOoutFileName(){
    return this.filename.slice(0, -11) + ".xlsx";
  }
  setMenuCH(CHs: string[]){
    this.CHs = CHs;
  }
  setFileName(filename: string){
    this.filename = filename;
    const nameparts = filename.split("_");
    
    this.excelPartName = "20" + nameparts[1].slice(0, 2) + "_" + nameparts[1].slice(2) + "_" + nameparts[0].slice(0, 4);
    console.log(this.excelPartName);
  }
}