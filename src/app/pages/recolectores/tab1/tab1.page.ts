import { Component, OnInit } from '@angular/core';
import { Recolector } from 'src/app/models/recolector';
import { SqliteManagerService } from 'src/app/services/sqlite-manager.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  public collector: Recolector[];
  public showForm: boolean;
  public name: string;
  public surname: string;
  public email: string;
  public phone: string;
  // public data = [];
  // public recolector: Recolector;

  constructor(private sqliteService: SqliteManagerService ) {
    this.showForm = false;
  }

  ngOnInit(): void {
    this.getRecolectores();
  }

  getRecolectores(){
    this.sqliteService.getRecolectores().then((collector: Recolector[]) => {
      this.collector = collector;
      console.log(this.collector)
    })
  }

  onShowForm(){
    this.showForm = true;
  }

  onCloseForm(){
    this.showForm = false;
  }

  searchCollectors($event){
    console.log($event.detail.value);
    this.sqliteService.getRecolectores($event.detail.value).then((collector: Recolector[])=>{
      this.collector = collector;
    })
  }

  createUpdateCollectors(){

  }
}
