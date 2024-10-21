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
                if (this.load) {
                    this.sincronizarDatos();
                }
            })
        })
    }

    async cargarContratos() {
        try {
          this.contratos = await this.maestraService.obtenerDtLocal();
          console.log('Contratos cargados:', this.contratos);
        } catch (error) {
          console.error('Error al cargar los contratos:', error);
        }
      }
    
      // Llama al proceso de sincronización que realiza la comparación, actualización e inserción
      async sincronizarDatos() {
        try {
          await this.maestraService.sincronizar('tiposcontrato');
          console.log('Sincronización completada exitosamente.');
          await this.cargarContratos();
        } catch (error) {
          console.error('Error en la sincronización:', error);
        }
      }
}