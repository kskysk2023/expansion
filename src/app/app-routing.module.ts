import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrepareComponent } from './prepare/prepare.component';
import { ResultComponent } from './result/result.component';

const routes: Routes = [
  {path : "prepare", component: PrepareComponent},
  {path : "result", component : ResultComponent},
  {path : "**", redirectTo : "/"}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
