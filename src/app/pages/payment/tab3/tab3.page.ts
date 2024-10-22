import { Component } from '@angular/core';
import { Maestra } from 'src/app/models/maestra';
import { MaestraService } from 'src/app/services/maestra.service';
import { VpsService } from 'src/app/services/vps.service';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  contratos: {id:number, nombre: string} [] = [];
  Datos: Maestra[] = []
  Diferencias: any[] = []

  constructor(private _vpsService: VpsService, private maestraService: MaestraService) {
    this.Datos = [];
  }

  // Método para traer los datos del VPS (opcional, si lo necesitas)
  traerMaestrasVps(event: any) {
    this._vpsService.obtener("tiposcontrato").subscribe(
      (data) => {
        this.Datos = data;
        console.log(this.Datos);
      },
      (e) => {
        console.error('Error al obtener datos: ', e)
      }
    );
  }

  // Cargar los contratos locales
  async cargarContratos() {
    try {
      this.contratos = await this.maestraService.obtenerDtLocal();
      console.log('Contratos cargados:', this.contratos);
    } catch (error) {
      console.error('Error al cargar los contratos:', error);
    }
  }

  async sincronizarDatos() {
    try {
      await this.maestraService.sincronizar('tiposcontrato');
      console.log('Sincronización completada exitosamente.');
      await this.cargarContratos();
    } catch (error) {
      console.error('Error en la sincronización:', error);
    }
  }

  ionViewDidEnter() {
    this.cargarContratos();
  }
}
