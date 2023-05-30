import { Injectable } from '@angular/core';
import { of } from 'rxjs/internal/observable/of';
import * as dfd from 'danfojs';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  CHBind = {
    compression: "CH1-1[V]", m1:"CH2-1[V]", m2:"CH3-1[V]", l1:"CH4-1[V]",l2:"CH5-1[V]",
    pI:"CH6-1[V]",pQ:"CH6-2[V]",rI:"CH7-1[V]",rQ:"CH7-2[V]"};
  filename = "";
  excelPartName = "";
  public CHs :string[] = [];
  df : dfd.DataFrame = new dfd.DataFrame;

  constructor() { }
  getDataFrame(){return this.df;}
  getCHBind() {return of(this.CHBind);}
  getCH(){return this.CHBind;}

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