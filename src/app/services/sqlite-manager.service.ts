import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Recolector } from '../models/recolector';
import { Recoleccion } from '../models/recoleccion';

//  import { catchError, map } from 'rxjs/operators';
//  import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteManagerService {

  private isWeb: boolean;
  private DB_SETUP_KEY = 'first_db_setup'    /** Para crear una vriable Alamcenamiento local:  habria que borrarla cuando se hagan cambios en la bd  */
  private DB_NAME_KEY = 'db_name'           /** Para crear una vriable Alamcenamiento local  */
  private dbName: string;
  public dbReady: BehaviorSubject<boolean>;
  documentos: { id: number, name: string }[] = [];
  bancos: { id: number, name: string }[] = [];
  contratos: {id: number, name: string} [] = [];
  fincas:{id: string, name: string, lotes: number} [] = [];
  recolec:{nit: number,nombre: string, nombre1: string, apellido1: string} [] = [];
  cosechas:{id: number, name: string} [] = [];
  tipos:{id: number, name: string} [] = [];

  constructor(private alertCtrl: AlertController, 
              private http: HttpClient) {
    this.isWeb = false;
    this.dbName = '';
    this.dbReady = new BehaviorSubject(false);      /**  Esta siempre escuchando BehaviorSubject */
  }

  async init(){
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    const alert = await this.alertCtrl.create({
      header: 'Informacion',
      message: 'INit',
      buttons: ['OK']
    });


    if (info.platform == 'android') {

      console.log("conecting from the android....")
      const permissionGranted = await sqlite.requestPermission();
      if (!permissionGranted) {
        const alert = await this.alertCtrl.create({
          header: 'Permiso necesario',
          message: 'Debes otorgar permisos para acceder a la base de datos',
          buttons: ['OK']
        });
        await alert.present();
      }

      const alert = await this.alertCtrl.create({
        header: 'Informacion',
        message: 'Se esta utilizando desde un android',
        buttons: ['OK']
      });
      await alert.present();

      try {
        await sqlite.requestPermission();
      } catch (error) {
        const alert = await this.alertCtrl.create({
          header: 'Atención',
          message: 'Se necesita el acseso a la base de datos de forma obligatoria',
          buttons: ['OK']
        });
        await alert.present();
      }
    }else if (info.platform == 'web') {
      console.log("conecting from the web....")
      this.isWeb = true;
      await sqlite.initWebStore(); /* inicializar sqlite en plataforma web */
    }
    await this.setupDataBase();
  }

  async setupDataBase(){
    const dbSetupDone = await Preferences.get({key: this.DB_SETUP_KEY})
    console.log("dbSetupDone.value:", dbSetupDone.value);

    if (!dbSetupDone.value) {
      await this.downloadDataBase();
      //await Preferences.set({ key: this.DB_SETUP_KEY, value: 'true' });
      //this.dbReady.next(true);
      console.log("Crear Conexion...")
    }else{
      console.log("ya esta configurada")
      const db = await this.getDbName();
      await CapacitorSQLite.createConnection({database: db});
      await CapacitorSQLite.open({database: db})
      this.dbReady.next(true);
    }
  }

  // downloadDataBase_1() {
  //   console.log("Iniciando descarga de base de datos...");
  //   this.http.get<JsonSQLite>('assets/db/db.json', { responseType: 'json' })
  //     .pipe(
  //       map(async (jsonExport: JsonSQLite) => {
  //         console.log("Contenido de JSON cargado:", jsonExport); // <-- Nuevo log
  //         const jsonString = JSON.stringify(jsonExport);
  //         console.log("JSON Exportado:", jsonString);
  //         try {
  //           const isValid = await CapacitorSQLite.isJsonValid({ jsonstring: jsonString });
  //           console.log("Validación de JSON:", isValid.result);
  //           if (isValid.result) {
  //             this.dbName = jsonExport.database;
  //             await CapacitorSQLite.importFromJson({ jsonstring: jsonString });
  //             console.log("Importación completada");
  //             await CapacitorSQLite.createConnection({ database: this.dbName });
  //             await CapacitorSQLite.open({ database: this.dbName });
  //             await Preferences.set({ key: this.DB_SETUP_KEY, value: '1' });
  //             await Preferences.set({ key: this.DB_NAME_KEY, value: this.dbName });
  //             console.log("Base de datos lista");
  //             this.dbReady.next(true);
  //           } else {
  //             console.error("BD no valida");
  //           }
  //         } catch (error) {
  //           console.error('Error durante la validación o importación de la base de datos:', error);
  //         }
  //       }),
  //       catchError((error) => {
  //         console.error('Error al cargar el archivo db.json:', error);
  //         return of(null); // Retornar un observable nulo en caso de error
  //       })
  //     )
  //     .subscribe();
  // }


  async downloadDataBase(){
    this.http.get('assets/db/db.json').subscribe(async ( jsonExport: JsonSQLite) =>{
      const jsonstring = JSON.stringify(jsonExport)
      const isValid = await CapacitorSQLite.isJsonValid({ jsonstring });
      if(isValid.result){
        this.dbName = jsonExport.database;
        await CapacitorSQLite.importFromJson({ jsonstring});   //Se crea la base de datos
        await CapacitorSQLite.createConnection({ database: this.dbName }) // Nos conectamos
        await CapacitorSQLite.open({database: this.dbName} )

        console.log("my bd is", this.dbName)
  
        await Preferences.set({key: this.DB_SETUP_KEY, value:'1'})          /** variable Alamcenamiento local first_db_setup lo colaca en 1 */
        await Preferences.set({key: this.DB_NAME_KEY, value: this.dbName}) /** vriable Alamcenamiento local  db_name */
        this.dbReady.next(true);
  
      }
    })
  }


  async getDbName(){
    if (!this.dbName) {
      const db = await Preferences.get({key: this.DB_NAME_KEY});
      this.dbName = db.value;
    }
    return this.dbName;
  }



  /**  Recolectores */

  async getRecolectores(search?: string){
    let sql = "SELECT * FROM recolectores WHERE active = 1 ";
    if (search) {
      sql += `AND (upper(nombre) LIKE '%${search.toLocaleUpperCase()}%' OR upper(apellido1) LIKE '%${search.toLocaleLowerCase()}%')`
    }
    const db = await this.getDbName();
    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values:[]
    }).then((response: capSQLiteValues) => {
      let recolectores: Recolector[] = [];
      for (let index = 0; index < response.values.length; index++) {
        const row = response.values[index];
        let recolector = row as Recolector;
        recolectores.push(recolector);
      }
      return Promise.resolve(recolectores)
    }).catch(error => Promise.reject(error))
  }

  async createRecolector(recolector: Recolector){
    let sql = 'INSERT INTO recolectores (nit, tipo_Identificacion, nombre, nombre1, nombre2, apellido1, apellido2, tipo_Contrato, observacion, banco, cuenta_bancaria, fec_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const db = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: db,
      set: [
        {
          statement: sql,
          values:[
            recolector.nit,
            recolector.tipo_Identificacion,
            recolector.nombre,
            recolector.nombre1,
            recolector.nombre2,
            recolector.apellido1,
            recolector.apellido2,
            recolector.tipo_Contrato,
            recolector.observacion,
            recolector.banco,
            recolector.cuenta_bancaria,
            recolector.fec_registro
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    }).catch(async (error) => {
      // Manejamos el error
      console.error('Error al crear recolector:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo crear el recolector. Intenta nuevamente.',
        buttons: ['OK']
      });
      await alert.present();
      throw error;
    });
  }
  
  async updateCollector(recolector: Recolector){
    let sql = 'UPDATE recolectores SET tipo_Identificacion=?, nombre=?, nombre1=?, nombre2=?, apellido1=?, apellido2=?, tipo_Contrato=?, observacion=?, banco=?, cuenta_bancaria=? WHERE nit = ?';
    const db = await this.getDbName();

    return CapacitorSQLite.executeSet({
      database: db,
      set:[
        {
          statement: sql,
          values:[
            recolector.tipo_Identificacion,
            recolector.nombre,
            recolector.nombre1,
            recolector.nombre2,
            recolector.apellido1,
            recolector.apellido2,
            recolector.tipo_Contrato,
            recolector.observacion,
            recolector.banco,
            recolector.cuenta_bancaria,
            recolector.nit
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    });
  }

  async deleteRecolector(recolector: Recolector){
    let sql = 'UPDATE recolectores SET active = 0 WHERE nit = ?'
    const db = await this. getDbName();
    return CapacitorSQLite.executeSet({
      database: db,
      set: [
        {
          statement: sql,
          values: [
            recolector.nit
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    });
  }


  /** Bancos */
  async getBancos() {
    const db = await this.getDbName(); 
    const query = 'SELECT id, name FROM bancos'; 
  
    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) => {
      this.bancos = result.values;
    }).catch((error) => {
      console.error('Error fetching banks:', error);
    });
  }

  getBancoName(bancoId: number): string {
    const banco = this.bancos.find(b => b.id === bancoId);
    return banco ? banco.name : 'Banco desconocido';
  }

  async getDocumentos(){
    const db = await this.getDbName();
    const query = 'SELECT id, name FROM tp_identificacion'

    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) =>{
      this.documentos = result.values;
    }).catch((error) => {
      console.error('Error al traer los documentos:', error);
    });
  }

  getDocumentoName(documentoId: number): string{
    const documento = this.documentos.find(b => b.id === documentoId);
    return documento ? documento.name : 'Documento desconocido';
  }

  async getContratos(){
    const db = await this.getDbName();
    const query = 'SELECT id, name FROM tp_contrato';

    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) => {
      this.contratos = result.values;
    }).catch((error) => {
      console.error('Error al traer los contratos:', error);
    });
  }

  getContratosName(contratoId: number): string{
    const contrato = this.contratos.find(b => b.id === contratoId);
    return contrato ? contrato.name : 'Contrato desconocido desconocido';
  }

    // Recolecion --------------------------------------------------------------------//

  async getRecoleccion(){
    let sql = 'SELECT * FROM recoleccion WHERE active = 1'

    const db = await this.getDbName();
    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues)=>{
      let recolecciones : Recoleccion[] = [];
      for (let index = 0; index < response.values.length; index++) {
        const row = response.values[index];
        const recoleccion = row as Recoleccion;
        recolecciones.push(recoleccion)
      }
      return Promise.resolve(recolecciones);
    }).catch(e => Promise.reject(e))
  }

  
  async getFincas(){
    const db = await this.getDbName(); 
    const query = 'SELECT id, name, lotes FROM finca'; 
    
    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) => {
      this.fincas = result.values;
    }).catch((error) => {
      console.error('Error fetching banks:', error);
    });
  }
  
  getFincaName(fincaId: string): string {
    const finca = this.fincas.find(fin => fin.id === fincaId);
    return finca ? finca.name : 'Nombre de finca desconocida';
  }
  
  getFincaLote(fincaId: string): number {
    const lotes = this.fincas.find(lot => lot.id === fincaId);
    return lotes ? lotes.lotes: 0
  }

  async getrecolectores(){
    const db = await this.getDbName(); 
    let sql = 'SELECT nit, nombre, nombre1, apellido1 FROM recolectores WHERE active = 1'

    CapacitorSQLite.query({
      database: db,
      statement: sql
    }).then((result) => {
      this.recolec = result.values;
    }).catch((error) => {
      console.error(error)
    });
  }

  async getCosechas() {
    const db = await this.getDbName();
    const query = 'SELECT id, name FROM cosecha';
    
    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) => {
      this.cosechas = result.values; // Guarda las `cosechas` para usar en el ion-select
    }).catch((error) => {
      console.error('Error al traer las cosechas:', error);
    });
  }

  async getTipoRec(){
    const db = await this.getDbName();
    const query = 'SELECT id, name FROM tipoRecoleccion';

    CapacitorSQLite.query({
      database: db,
      statement: query
    }).then((result) => {
      this.tipos = result.values;
    }).catch((error) => {
      console.error('Error al traer las cosechas:', error);
    });
  }
  

  async createRecoleccion(recoleccion: Recoleccion) {
    let sql = 'INSERT INTO recoleccion (id, cosechaId, nit_recolectores, fecha, finca, lote, variedad, tipoRecoleccion, cantidad, vlrRecoleccion, observacion, fecRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const db = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: db,
      set: [
        {
          statement: sql,
          values: [
            recoleccion.id,
            recoleccion.cosechaId,
            recoleccion.nit_recolectores,
            recoleccion.fecha,
            recoleccion.finca,
            recoleccion.lote, 
            recoleccion.variedad,
            recoleccion.tipoRecoleccion,
            recoleccion.cantidad,
            recoleccion.vlrRecoleccion,
            recoleccion.observacion,
            recoleccion.fecRegistro
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    }).catch((error) => {
      console.error('Error al insertar la recolección:', error);
      throw new Error('Error al insertar la recolección: ' + error.message);
    });
  }
  
  async updateRecoleccion(recoleccion: Recoleccion){
    let sql = 'UPDATE recoleccion SET cosechaId=?, nit_recolectores=?, fecha=?, finca=?, lote=?, variedad=?, tipoRecoleccion=?, cantidad=?, vlrRecoleccion=?, observacion=? WHERE id = ?';
    const db = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database: db,
      set: [
        {
          statement: sql,
          values: [
            recoleccion.cosechaId,
            recoleccion.nit_recolectores,
            recoleccion.fecha,
            recoleccion.finca,
            recoleccion.lote, 
            recoleccion.variedad,
            recoleccion.tipoRecoleccion,
            recoleccion.cantidad,
            recoleccion.vlrRecoleccion,
            recoleccion.observacion,
            recoleccion.id
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    });
  }

  async deleteRecoleccion(recoleccion: Recoleccion){
    let sql = 'UPDATE recoleccion SET active = 0 WHERE id = ?'
    const db = await this.getDbName();
    return CapacitorSQLite.executeSet({
      database : db,
      set: [
        {
          statement: sql,
          values: [
            recoleccion.id
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    });
  }

}
