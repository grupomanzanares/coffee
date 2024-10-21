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

  Datos : Maestra[] = [];
  Diferencias: any[] = [];

  constructor(private _vpsService: VpsService, private maestraService: MaestraService) {
    this.Datos = [];
  }

  traerMaestrasVps(event: any){
    this._vpsService.obtener("tiposcontrato").subscribe(
      (data)=>{
        this.Datos = data;
        console.log(this.Datos);
      },
      (e) => {
        console.error('Error al obtener datos: ', e)
      }
    );
  }

  async comparar(event: any) {
    try {
      // Esperamos a que la comparacion devuelva el resultado
      const diferencias = await lastValueFrom(this.maestraService.comparacion('tiposcontrato'));
  
      this.Diferencias = diferencias;
      console.log('Datos diferentes encontrados: ', this.Diferencias);
  
      if (this.Diferencias.length > 0) {
        try {
          await this.maestraService.update(this.Diferencias);
          console.log('Datos actualizados correctamente.');
        } catch (error) {
          console.error('Error al actualizar los datos: ', error);
        }
      } else {
        console.log('No hay datos diferentes para actualizar.');
      }
    } catch (error) {
      console.error('Error al comparar datos: ', error);
    }
  }

}
