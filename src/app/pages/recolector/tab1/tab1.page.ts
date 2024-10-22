import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Banco } from 'src/app/models/bancos';
import { Contrato } from 'src/app/models/contrato';
import { Documento } from 'src/app/models/documentos'
import { Recolector } from 'src/app/models/recolector';
import { AlertService } from 'src/app/services/alert.service';
import { MaestraService } from 'src/app/services/maestra.service';
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
  public currentDate: string;
  public bancos: Banco[];
  public documentos: Documento[];
  public Tcontratos: Contrato[];
  
  constructor(public sqliteService: SqliteManagerService,  private alertService: AlertService, private maestraService: MaestraService) {
    this.showForm = false;
    this.update = false;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    this.currentDate = `${day}/${month}/${year}`;
  }
  
  ngOnInit(): void {
    this.getBancos();
    this.getDocumentos();
    this.getContratos();
    this.getRecolectores();
    if (!this.recolector) {
      this.recolector = new Recolector();
    }else{
      this.update = true; 
    }
  }

  // Carga inicial de datos
  async loadInitialData() {
    try {
      // Asegurarse de que la base de datos está lista
      if (!this.sqliteService.dbReady.getValue()) {
        this.sqliteService.dbReady.subscribe(async (isReady) => {
          if (isReady) {
            await this.getBancos();
            await this.getDocumentos();
            await this.getContratos();
            await this.getRecolectores();
          }
        });
      } else {
        await this.getBancos();
        await this.getDocumentos();
        await this.getContratos();
        await this.getRecolectores();
      }
    } catch (error) {
      console.error('Error al cargar los datos iniciales:', error);
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

  getBancos(){
    this.sqliteService.getBancos().then((bancos: Banco[]) =>{
      this.bancos = bancos;
    })
  }

  getDocumentos(){
    this.sqliteService.getDocumentos().then((documentos: Documento[]) =>{
      this.documentos = documentos
    })
  }

  async getContratos() {
    try {
      this.Tcontratos = await this.maestraService.obtenerDtLocal('tp_contrato');
      console.log('Contratos obtenidos desde SQLite: ', this.Tcontratos);
    } catch (e) {
      console.error('Error al cargar contratos:', e);
    }
  }

  async sincronizarContratos() {
    try {
      await this.maestraService.sincronizar('tiposcontrato', 'tp_contrato');
      console.log('Sincronización de contratos completada.');
      await this.getContratos(); 
    } catch (e) {
      console.error('Error en la sincronización de contratos:', e);
    }
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
    this.recolector.fec_registro = moment().format('YYYY-MM-DDTHH:mm');
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
        this.alertService.alertMenssage('Error', JSON.stringify(e));
        console.log(e)
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
