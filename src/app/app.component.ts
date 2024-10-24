import { Component } from '@angular/core';
import { Device } from '@capacitor/device';
import { Platform } from '@ionic/angular';
import { SqliteManagerService } from './services/sqlite-manager.service';
import { MaestraService } from './services/maestra.service';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public isWeb: boolean;
  public load: boolean = false;
  contratos: {id:number, nombre: string} [] = []
    
  constructor(private platform: Platform, private sqliteService: SqliteManagerService, private maestraService: MaestraService ) {
    this.isWeb = false;
    this.initApp();
  }

  initApp(){
    this.platform.ready().then( async ()=> {
      const info =  await Device.getInfo();
      this.isWeb = info.platform === 'web' 
      
      this.sqliteService.init();
      this.sqliteService.dbReady.subscribe(isReady =>{
        this.load = isReady;
        // if (this.load) {
        //   this.cargarContratos();
        // }
      })
    })
  }

  async cargarContratos() {
    try {
      this.contratos = await this.maestraService.obtenerDtLocal('tp_contrato');
      console.log('Contratos cargados:', this.contratos);
    } catch (error) {
      console.error('Error al cargar los contratos:', error);
    }
  }
}