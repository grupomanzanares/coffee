import { Component, OnInit } from '@angular/core';
import { Recoleccion } from 'src/app/models/recoleccion';
import { Recolector } from 'src/app/models/recolector';
import { SqliteManagerService } from 'src/app/services/sqlite-manager.service';
import * as moment from 'moment';
import { AlertService } from 'src/app/services/alert.service';
import { Cosecha } from 'src/app/models/cosechas';
import { Finca } from 'src/app/models/fincas';
import { TipoRecolec } from 'src/app/models/tipoRecolecion';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  public recoleccion: Recoleccion[];
  public objRecoleccion: Recoleccion;
  public showForm: boolean;
  public update: boolean;
  public currentYear: string;
  public currentDate: string;
  public lotesDisponibles: number[] = [];
  public preMin: number = 0;
  public preMax: number = 0;
  public cosechas: Cosecha[];
  public recolector: Recolector[];
  public finca: Finca[];
  public tipoRecoleccion: TipoRecolec[];

  constructor(public sqliteService: SqliteManagerService, private alertService: AlertService) {
    this.showForm = false;
    this.recoleccion = [];
    this.update = false;
    this.currentYear = new Date().getFullYear().toString();
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    this.currentDate = `${day}/${month}/${year}`;
    this.objRecoleccion = new Recoleccion();
  }
  

  ngOnInit(): void {
    this.getCosechas();
    this.getTipoRec();
    this.getRecoleccion();
    this.getFincas();
    this.getrecolectores();

    // Asignar `currentYear` como número correctamente a `cosechaId`
    // this.objRecoleccion.cosechaId = parseInt(this.currentYear, 10); 
    this.objRecoleccion.nit_recolectores = Number(this.objRecoleccion.nit_recolectores);
    // this.objRecoleccion.variedad = Number(this.objRecoleccion.variedad);
    // this.objRecoleccion.cantidad = Number(this.objRecoleccion.cantidad);
    this.objRecoleccion.vlrRecoleccion = 0;
    this.objRecoleccion.fecha = this.currentDate; 
  }

  soloLetras(event: any){
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^a-zA-Z]/g, '');
  }

  soloNumeros(event: any){
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '')
  }

  getRecoleccion(){
    Promise.all([
      this.sqliteService.getRecolectores(),
      this.sqliteService.getRecoleccion()
    ]).then(results => {
      let recolectores = results[0];
      this.recoleccion = results[1];
      console.log('Datos de recoleccion:', this.recoleccion);
      this.associate(recolectores);
    }).catch(error => {
      console.error('Error al obtener recolección:', error);
    });
  }
  
  getCosechas(){
    this.sqliteService.getCosechas().then((cosecha: Cosecha[]) =>{
      this.cosechas = cosecha
    })
  }

  getrecolectores(){
    this.sqliteService.getRecolectores().then((recolector: Recolector[]) => {
      this.recolector = recolector
    }).catch((e) =>{
      console.error('Error al traer los recolectores', e)
    })
  }

  getFincas() {
    this.sqliteService.getFincas().then((fincas) => {
      this.finca = fincas;
      console.log('Fincas cargadas:', this.finca);  // Verificar si las fincas se cargaron correctamente
    }).catch((error) => {
      console.error('Error al obtener las fincas:', error);
    });
  }

  getTipoRec(){
    this.sqliteService.getTipoRec().then((tipo: TipoRecolec[]) =>{
      this.tipoRecoleccion = tipo
    })
  }

  generateRecoleccionId(fincaId: string) {
    if (!fincaId) {
      console.error('Finca ID no válido:', fincaId);
      return;
    }
    const registrosFinca = this.recoleccion.filter(recoleccion => String(recoleccion.finca) === fincaId);
    const newNumber = registrosFinca.length + 1; 
    const formattedNumber = String(newNumber).padStart(2, '0');

    if (fincaId && formattedNumber) {
      this.objRecoleccion.id = `${fincaId}${formattedNumber}`;
    } else {
      console.error('Error generando ID:', { fincaId, formattedNumber });
      return;
    }
    console.log('ID generado:', this.objRecoleccion.id);
  }
  
  private associate(recolectores: Recolector[]){
    this.recoleccion.forEach(row => {
      let recolector = recolectores.find(rec => rec.nit === row.nit_recolectores);
      if (recolector) {
        row.recolector = recolector;
      }
    });
    console.log(this.recoleccion);
  }

  onShowForm(){
    console.log('Showing form');
    this.showForm = true;
    this.getRecoleccion();
  }

  onCloseForm(){
    this.update = false;
    this.objRecoleccion = new Recoleccion();
    this.showForm = false;
    this.getRecoleccion();
  }

  onFincaChange(event: any) {
    const fincaId = event.detail.value;     
    if (!fincaId) {
      console.error('Finca seleccionada no es válida:', fincaId);
      return;
    } 
    if (!this.finca || this.finca.length === 0) {
      console.error('Error: No se han cargado las fincas.');
      return;
    }
    console.log('Finca seleccionada:', fincaId);
    const selectedFinca = this.finca.find(finca => finca.id === fincaId);
    // Si la finca tiene lotes, generar la lista de lotes como un arreglo de números
    if (selectedFinca && selectedFinca.lotes) {
      this.lotesDisponibles = Array.from({ length: selectedFinca.lotes }, (_, i) => i + 1);
    } else {
      this.lotesDisponibles = []; // Si no hay lotes, dejar el arreglo vacío
    }
    this.generateRecoleccionId(fincaId);
  }
  
  onRecolectorChange(event: any) {
    const recolectorId = event.detail.value;
    const recolector = this.recolector.find(rec => rec.nit === recolectorId);
    if (recolector) {
      // Solo asigna las propiedades necesarias
      this.objRecoleccion.recolector = {
        nit: recolector.nit,
        nombre1: recolector.nombre1,
        apellido1: recolector.apellido1,
      };
    } else {
      console.error('Error: No se encontró el recolector con nit:', recolectorId);
    }
  }
  
  onCosechaChange(event: any) {
    const cosechaId = event.detail.value;
    console.log('Cosecha seleccionada:', cosechaId);
    // Asignar el valor al objeto de recolección
    this.objRecoleccion.cosechaId = cosechaId;
  } 
  
  tipoRecolecion(event: any) {
    console.log('Tipo de recolección seleccionado:', event.detail.value);
    const tipo = event.detail.value;
    console.log(tipo);
    if (tipo === 1) {
      this.preMin = 10000;
      this.preMax = 50000;
    } else {
      this.preMin = 25000;
      this.preMax = 100000;
    }
    console.log(this.preMin, this.preMax);
  }
  
  validarNitRecolector(event: any) {
    const value = event.detail.value; 
    if (!isNaN(value)) {
      this.objRecoleccion.nit_recolectores = Number(value);
    } else {
      this.objRecoleccion.nit_recolectores = null;
      console.error('Error: el valor de nit_recolectores no es un número válido');
    }
  }

  creaateRecoleccion() {
    try {
      this.objRecoleccion.fecRegistro = moment().format('YYYY-MM-DDTHH:mm');
      console.log('Datos a insertar:', this.objRecoleccion);
  
      // Validaciones
      if (!this.objRecoleccion.id || isNaN(this.objRecoleccion.cosechaId) || isNaN(this.objRecoleccion.nit_recolectores) || isNaN(this.objRecoleccion.vlrRecoleccion)) {
        console.error('Error: uno o más valores numéricos no son válidos.', this.objRecoleccion);
        return; 
      }
  
      if (this.update) {
        this.sqliteService.updateRecoleccion(this.objRecoleccion).then(() =>{
        this.alertService.alertMenssage('Exito', 'Datos actualizados con exito');
        this.onCloseForm();
        }).catch(e => {
          console.log(e)
          this.alertService.alertMenssage(e, JSON.stringify(e))
        })
      } else {
        // Insertar nueva recolección
        this.sqliteService.createRecoleccion(this.objRecoleccion).then(() => {
          this.alertService.alertMenssage('Excelente', 'Recolección guardada');
          this.getRecoleccion(); 
          this.onCloseForm();
          this.sqliteService.getRecolectores();
        }).catch(error => {
          console.error('Error al insertar recolección:', error);
          this.alertService.alertMenssage('Todo lo que podia salir mal salio mal', JSON.stringify(error));
        });
      }
    } catch (error) {
      console.error('Error al preparar los datos para inserción:', error);
    }
  }  

  updateRecoleccion(recoleccion: Recoleccion) {
    this.objRecoleccion = recoleccion;
    
    // Obtener las fincas del servicio
    this.sqliteService.getFincas().then((fincas: Finca[]) => {
      // Convertir `recoleccion.finca` a número para hacer la comparación
      const selectedFinca = fincas.find(finca => finca.id === Number(recoleccion.finca)); // Convertir `recoleccion.finca` a number
      if (selectedFinca) {
        // Si la finca tiene lotes, generar la lista de lotes
        if (selectedFinca.lotes) {
          this.lotesDisponibles = Array.from({ length: selectedFinca.lotes }, (_, i) => i + 1);
        } else {
          this.lotesDisponibles = [];
        }
      }
      
      // Asignar tipo de recolección
      this.objRecoleccion.tipoRecoleccion = recoleccion.tipoRecoleccion;
      console.log('Tipo de recolección asignado:', this.objRecoleccion.tipoRecoleccion);
      
      // Actualizar el estado a `update`
      this.update = true;
      this.onShowForm(); // Mostrar el formulario después de que se haya completado todo
    }).catch(error => {
      console.error('Error al obtener las fincas:', error);
    });
  }
  

  deleteRecolecconConfirm(recoleccion: Recoleccion){
    const sefl = this
    this.alertService.alertConfirm('¿Eliminar?','¿Estas seguro que quieres eliminar esta recoleccion?', function(){
      sefl.deleteRecoleccion(recoleccion)
    })
  }

  deleteRecoleccion(recoleccion: Recoleccion){
    this.sqliteService.deleteRecoleccion(recoleccion).then(() => {
      this.alertService.alertMenssage('Exito', 'Recoleccion eliminada');
      this.getRecoleccion();
    }).catch(e =>{
      this.alertService.alertMenssage('Error', JSON.stringify(e))
    })
  }
}
