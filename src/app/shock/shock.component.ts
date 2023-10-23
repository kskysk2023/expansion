import { Component } from '@angular/core';
import { SettingService } from '../setting.service';
import { Shock } from '../shock';

@Component({
  selector: 'app-shock',
  templateUrl: './shock.component.html',
  styleUrls: ['./shock.component.css']
})
export class ShockComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];
  shock : Shock;

  constructor(public settingService: SettingService){
    this.shock = settingService.shock;
  }
  ngOnInit(){ }
}
