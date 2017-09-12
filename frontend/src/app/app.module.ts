import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { RunnersComponent } from './runners/runners.component';
import { RunnerComponent } from './runner/runner.component';
import { CompetitionsComponent } from './competitions/competitions.component';
import { CompetitionComponent } from './competition/competition.component';
import { AboutComponent } from './about/about.component';
import { ServiceComponent } from './service/service.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RunnersComponent,
    RunnerComponent,
    CompetitionsComponent,
    CompetitionComponent,
    AboutComponent,
    ServiceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
