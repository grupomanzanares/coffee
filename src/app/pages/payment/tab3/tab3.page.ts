import { Component } from '@angular/core';
import { MaestraService } from 'src/app/services/maestra.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  contratos: {id:number, nombre: string} [] = [];

  constructor(private maestraService: MaestraService) {}

  ionViewDidEnter() {
    this.cargarContratos();
  }

  async cargarContratos() {
    try {
      this.contratos = await this.maestraService.obtenerDtLocal();
      console.log('Contratos cargados:', this.contratos);
    } catch (error) {
      console.error('Error al cargar los contratos:', error);
    }
  }
}
