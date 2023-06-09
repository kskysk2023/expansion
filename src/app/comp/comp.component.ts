import { Component } from '@angular/core';
import { CompService } from '../comp.service';

@Component({
  selector: 'app-comp',
  templateUrl: './comp.component.html',
  styleUrls: ['./comp.component.css']
})
export class CompComponent {
  displayedColumns: string[] = ['name', 'value', 'unit'];
  constructor(public compService : CompService){}
}
