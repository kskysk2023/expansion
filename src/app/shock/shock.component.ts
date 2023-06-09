import { Component } from '@angular/core';
import { ShockService } from '../shock.service';

@Component({
  selector: 'app-shock',
  templateUrl: './shock.component.html',
  styleUrls: ['./shock.component.css']
})
export class ShockComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];

  constructor(public shockService: ShockService){}
  ngOnInit(){ }
}
