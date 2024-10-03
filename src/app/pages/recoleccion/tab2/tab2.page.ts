import { Component, OnInit } from '@angular/core';
import { Recoleccion } from 'src/app/models/recoleccion';
import { Recolector } from 'src/app/models/recolector';
import { SqliteManagerService } from 'src/app/services/sqlite-manager.service';
import * as moment from 'moment';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  public recoleccion: Recoleccion[];
  public objRecoleccion: Recoleccion;
  public recolectores: Recolector[];
  public showForm: boolean;
  public update: boolean;
  public currentYear: string;
  public currentDate: string;
  public lotesDisponibles: number[] = [];
  public preMin: number = 0;
  public preMax: number = 100;

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
    this.objRecoleccion.vlrRecoleccion = 0;
    console.log('Constructor - objRecoleccion:', this.objRecoleccion);
  }
  

  ngOnInit(): void {
    console.log('ngOnInit started');
    this.getRecoleccion();
    this.sqliteService.getFincas();
    this.sqliteService.getrecolectores();
    console.log('ngOnInit - objRecoleccion:', this.objRecoleccion);

    // Asignar `currentYear` como número correctamente a `cosechaId`
    this.objRecoleccion.cosechaId = parseInt(this.currentYear, 10); // Cambia esta línea
    this.objRecoleccion.nit_recolectores = Number(this.objRecoleccion.nit_recolectores);
    this.objRecoleccion.variedad = Number(this.objRecoleccion.variedad);
    this.objRecoleccion.cantidad = Number(this.objRecoleccion.cantidad);
    this.objRecoleccion.vlrRecoleccion = Number(this.objRecoleccion.vlrRecoleccion);  
    this.objRecoleccion.vlrRecoleccion = 0;
    this.objRecoleccion.fecha = this.currentDate; 
}

  

  getRecoleccion(){
    console.log('Datos de recoleccion:', this.recoleccion);
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
  
  generateRecoleccionId(fincaId: string) {
    if (!fincaId) {
      console.error('Finca ID no válido:', fincaId);
      return;
    }

    const registrosFinca = this.recoleccion.filter(recoleccion => String(recoleccion.finca) === fincaId);
    
    // Validar que registrosFinca sea un array válido
    if (!registrosFinca || registrosFinca.length === 0) {
      console.error('No se encontraron registros de finca.');
      return;
    }
  
    const newNumber = registrosFinca.length + 1; // Obtener el número siguiente
    const formattedNumber = String(newNumber).padStart(2, '0'); // Formatear el número con dos dígitos (e.g., "01", "02")
    
    // Validar que el ID generado no sea NaN
    // Concatenar los valores como string y luego convertirlos a number
    this.objRecoleccion.id = Number(`${fincaId}${formattedNumber}`);
    console.log('ID generado:', this.objRecoleccion.id);

  }
  
  
  
  private associate(recolectores: Recolector[]){
    this.recoleccion.forEach(row => {
      console.log(row);
      let recolector = recolectores.find(rec => rec.nit === row.nit_recolectores); // Usar === para comparar
      if (recolector) {
        row.recolector = recolector;
      }
    });
    console.log(this.recoleccion);
  }

  onShowForm(){
    console.log('Showing form');
    this.showForm = true;
  }

  onCloseForm(){
    console.log('Closing form');
    this.update = false;
    this.objRecoleccion = new Recoleccion();
    this.showForm = false;
    this.getRecoleccion();
  }

  onFincaChange(event: any) {
    const fincaId = event.detail.value; // Obtener el ID de la finca seleccionada
    
    // Validar que fincaId no sea NaN o undefined
    if (!fincaId) {
      console.error('Finca seleccionada no es válida:', fincaId);
      return;
    }
  
    console.log('Finca seleccionada:', fincaId);
  
    const selectedFinca = this.sqliteService.fincas.find(finca => finca.id === fincaId);
    
    // Si la finca tiene lotes, generar la lista de lotes como un arreglo de números
    if (selectedFinca && selectedFinca.lotes) {
      this.lotesDisponibles = Array.from({ length: selectedFinca.lotes }, (_, i) => i + 1);
    } else {
      this.lotesDisponibles = []; // Si no hay lotes, dejar el arreglo vacío
    }
  
    // Generar el ID de la recolección basado en la finca seleccionada
    this.generateRecoleccionId(fincaId);
  }
  
  
  tipoRecolecion(event: any){
    const tipo = event.detail.value
    console.log(tipo)

    if(tipo === 'kg'){
      this.preMin = 10000
      this.preMax = 50000
    }else{
      this.preMin = 25000
      this.preMax = 100000
    }
    console.log(this.preMin, this.preMax)
  }

  validarVariedad(event: any) {
    const value = event.detail.value; // cambia target por detail
    if (!isNaN(value)) {
      this.objRecoleccion.variedad = Number(value);
    } else {
      this.objRecoleccion.variedad = null; // o algún valor por defecto
      console.error('Error: el valor de variedad no es un número válido');
    }
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
      if ( isNaN(this.objRecoleccion.id) || isNaN(this.objRecoleccion.cosechaId) || isNaN(this.objRecoleccion.nit_recolectores) || isNaN(this.objRecoleccion.variedad) || isNaN(this.objRecoleccion.cantidad) || isNaN(this.objRecoleccion.vlrRecoleccion)
      ) {
        console.error('Error: uno o más valores numéricos no son válidos.');
        return; 
      }
      
  
      if (this.update) {
        // Lógica para actualizar recolección (si estás actualizando)
      } else {
        // Insertar nueva recolección
        this.sqliteService.createRecoleccion(this.objRecoleccion).then(() => {
          this.alertService.alertMenssage('Excelente', 'Recolección guardada');
          this.getRecoleccion(); // Actualiza la lista de recolecciones
          this.onCloseForm();
        }).catch(e => {
          console.error('Error al insertar recolección:', e);
          this.alertService.alertMenssage('Todo lo que podia salir mal salio mal', JSON.stringify(e));
        });
      }
    } catch (error) {
      console.error('Error al preparar los datos para inserción:', error);
    }
  }
  
}
