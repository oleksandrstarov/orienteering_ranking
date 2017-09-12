import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { RunnersComponent } from './runners/runners.component';
import { CompetitionsComponent } from './competitions/competitions.component';
import { RunnerComponent } from './runner/runner.component';
import { CompetitionComponent } from './competition/competition.component';
import { AboutComponent } from './about/about.component';

const routes: Routes = [
  {path: '', redirectTo: 'home', pathMatch: 'full'},
  {path: 'home', component: HomeComponent},
  {path: 'runners', component: RunnersComponent},
  {path: 'runner/:id', component: RunnerComponent},
  {path: 'competitions', component: CompetitionsComponent},
  {path: 'competition/:id', component: CompetitionComponent},
  {path: 'about', component: AboutComponent},
  {path: '**', redirectTo: 'runners', pathMatch: 'full'}
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
