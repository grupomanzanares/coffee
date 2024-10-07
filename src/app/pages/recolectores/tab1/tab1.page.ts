import { Component, OnInit } from '@angular/core';
import { Recolector } from 'src/app/models/recolector';
import { AlertService } from 'src/app/services/alert.service';
import { SqliteManagerService } from 'src/app/services/sqlite-manager.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  public collector: Recolector[];
  public recolector: Recolector;  
  public showForm: boolean;
  public update: boolean;

  // public data = [];

  
  constructor(public sqliteService: SqliteManagerService, private alertService: AlertService) {
    this.showForm = false;
    this.update = false;
  }
  
  ngOnInit(): void {
    this.sqliteService.getDocumentos();
    this.sqliteService.getBancos();
    this.sqliteService.getContratos();
    this.getRecolectores();
    if (!this.recolector) {
      this.recolector = new Recolector();
    }else{
      this.update = true; 
    }
  }

  soloLetras(event: any){
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z]/g, '');
  }

  soloNumeros(event: any){
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '')
  }

  getRecolectores(){
    this.collector = [];
    this.sqliteService.getRecolectores().then((collector: Recolector[]) => {
      this.collector = collector;
      console.log("recolectores: ", collector)
    })
  }

  onShowForm(){
    this.showForm = true;
  }

  onCloseForm(){
    this.update = false;
    this.recolector = new Recolector();
    this.showForm = false;
  }

  searchCollectors($event){
    
    console.log($event.detail.value);
    this.sqliteService.getRecolectores($event.detail.value).then((collector: Recolector[])=>{
      this.collector = collector;
    })
  }

  createUpdateCollectors(){
    if (this.update) {
      this.sqliteService.updateCollector(this.recolector).then(()=>{
        this.alertService.alertMenssage('Exito', 'Datos actualizados con exito')
        this.update = false;
        this.recolector = null;
        this.getRecolectores();  
      }).catch(e =>{
        console.log(e)
        this.alertService.alertMenssage(e, JSON.stringify(e))
      })
    }else{
      this.sqliteService.createRecolector(this.recolector).then((recolector) =>{
        console.log(recolector)
        this.alertService.alertMenssage('Exito', 'Recolector agregado correctamente');
        this.getRecolectores(); 
      }).catch(e =>{
        this.alertService.alertMenssage('Error', JSON.stringify(e))
      })
    }
    this.onCloseForm(); 
  }

  updateCollector(recolector: Recolector){
    this.recolector = recolector;
    this.update = true;
    this.onShowForm();
  }

  deleteCollectorConfirm(recolector: Recolector){
    const selft = this;
    this.alertService.alertConfirm("¿Seguro?", `¿Estas seguro de eliminar al recolector ${recolector.nombre1} ${recolector.apellido1}?`, function(){
      selft.deleteRecolector(recolector)    
    })
  }

  deleteRecolector(recolector : Recolector){
    this.sqliteService.deleteRecolector(recolector).then (() => {
      this.alertService.alertMenssage('Exito', 'Estudiante eliminado');
      this.getRecolectores();
    }).catch(e =>{
      this.alertService.alertMenssage('Error', JSON.stringify(e))
    })
  }
}
