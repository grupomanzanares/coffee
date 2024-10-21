import { Component } from '@angular/core';
import { MaestraService } from 'src/app/services/maestra.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  contratos: {id:number, nombre: string} [] = []

  constructor(private maestraService: MaestraService) {}

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
  ionViewDidEnter() {
    // Cargamos los contratos locales al entrar a la página
    this.cargarContratos();
  }
}
