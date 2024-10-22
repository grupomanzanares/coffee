import { Component } from '@angular/core';
import { Maestra } from 'src/app/models/maestra';
import { MaestraService } from 'src/app/services/maestra.service';
import { VpsService } from 'src/app/services/vps.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  maestra: {id:number, nombre: string} [] = [];
  Datos: Maestra[] = []
  Diferencias: any[] = []

  constructor(private _vpsService: VpsService, private maestraService: MaestraService) {
    this.Datos = [];
  }

  // Método para traer los datos del VPS (opcional, si lo necesitas)
  traerMaestrasVps() {
    this._vpsService.obtener("cosechas").subscribe(
      (data) => {
        this.Datos = data;
        console.log(this.Datos);
      },
      (e) => {
        console.error('Error al obtener datos: ', e)
      }
    );
  }

  // Cargar los maestra locales
  async cargar() {
    try {
      const contratos = await this.maestraService.obtenerDtLocal('tp_contrato');
      const bancos = await this.maestraService.obtenerDtLocal('bancos');
      const identificacion = await this.maestraService.obtenerDtLocal('tp_identificacion');
      const tpRecoleccion = await this.maestraService.obtenerDtLocal('tipoRecoleccion');
      const cosechas = await this.maestraService.obtenerDtLocal('cosecha');
      this.maestra = [...contratos, ...bancos, ...identificacion, ...tpRecoleccion, ...cosechas];  // Combina ambos arrays en uno solo
      console.log('Datos combinados cargados:', this.maestra);
    } catch (error) {
      console.error('Error al cargar los datos:', error);
    }
  }

  async sincronizarDatos() {
    try {
      await this.maestraService.sincronizar('tiposcontrato', 'tp_contrato');
      await this.maestraService.sincronizar('tiposidentificacion', 'tp_identificacion');
      await this.maestraService.sincronizar('tiposrecoleccion', 'tipoRecoleccion');
      await this.maestraService.sincronizar('bancos', 'bancos');
      await this.maestraService.sincronizar('cosechas', 'cosecha');
      await this.cargar();  // Cargar y combinar los datos después de la sincronización
      console.log('Sincronización completada exitosamente.');
    } catch (error) {
      console.error('Error en la sincronización:', error);
    }
  }


  ionViewDidEnter() {
    this.cargar();
    // this.sincronizarDatos();
    // this.traerMaestrasVps();
  }
}
