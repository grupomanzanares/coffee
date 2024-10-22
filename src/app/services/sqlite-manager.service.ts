import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Recolector } from '../models/recolector';
import { Recoleccion } from '../models/recoleccion';
import { Banco } from '../models/bancos';
import { Contrato } from '../models/contrato';
import  { Documento } from '../models/documentos'
import { Cosecha } from '../models/cosechas';
import { Finca } from '../models/fincas';
import { TipoRecolec } from '../models/tipoRecolecion';

@Injectable({
  providedIn: 'root'
})
export class SqliteManagerService {

  private isWeb: boolean;
  private DB_SETUP_KEY = 'first_db_setup'    /** Para crear una vriable Alamcenamiento local:  habria que borrarla cuando se hagan cambios en la bd  */
  private DB_NAME_KEY = 'db_name'           /** Para crear una vriable Alamcenamiento local  */
  private dbName: string;
  public dbReady: BehaviorSubject<boolean>;
  
  public tipos:TipoRecolec[];
  public fincas: Finca[];
  public recolec: Recolector[];
  public cosechas: Cosecha [];
  public contratos: Contrato [];
  public bancos: Banco[];
  public documentos: Documento [];


  constructor(private alertCtrl: AlertController, 
              private http: HttpClient) {

    this.isWeb = false;
    this.dbName = '';
    this.dbReady = new BehaviorSubject(false);      /**  Esta siempre escuchando BehaviorSubject */
  }

 /* Inicializar la base de datos  */
async init(){
  const info = await Device.getInfo();     /* obtener la información del dispositivo */
  const sqlite = CapacitorSQLite as any;   /* objeto sqlite */

  if(info.platform == 'android'){         /* si es un Android */
    try {
        await sqlite.requestPermission();     /* solicitar permisos */
    } catch (error) {  /* si hubo error entonces indicar que se requieren permisos  */
      const alert = await this.alertCtrl.create({
        header: 'Atención',
        message: 'Se necesita el acceso a la base de datos de forma obligatoria',
        buttons:['OK']
      });
      await alert.present();
    }
  }else if(info.platform == 'web'){ //web
    this.isWeb = true;
    await sqlite.initWebStore();  /* inicializar sqlite en plataforma web */
  }
  this.setupDataBase();
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
  async getBancos(search?: string) {
    const sql = 'SELECT id, nombre FROM bancos'; 
    const db = await this.getDbName(); 
    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues)=>{
      let bancos: Banco[] =[];
      for (let index = 0; index < response.values.length; index ++){
        const row = response.values[index];
        let banco = row as Banco;
        bancos.push(banco);
      }
      return Promise.resolve(bancos);
    }).catch(error => Promise.reject(error))
  }

  // ** Documentos */

  async getDocumentos(search?: string){
    const sql = 'SELECT id, nombre FROM tp_identificacion'
    const db = await this.getDbName();

    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) =>{
      let documentos: Documento[] = [];
      for (let i = 0; i < response.values.length; i++) {
        const element = response.values[i];
        let documento = element as Documento;
        documentos.push(documento)
      }
      return Promise.resolve(documentos);
    }).catch((error) => {
      console.error('Error al traer los documentos:', error);
    });
  }

  // ** Contratos */

  async getContratos(search?: string){
    const sql = 'SELECT id, nombre FROM tp_contrato';
    const db = await this.getDbName();

    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) => {
      let contratos: Contrato[] = [];
      for (let i = 0; i < response.values.length; i++) {
        const element = response.values[i];
        let contrato = element as Contrato;
        contratos.push(contrato)        
      }
      return Promise.resolve(contratos);
    }).catch((error) => {
      console.error('Error al traer los contratos:', error);
    });
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

  
  async getFincas(search?: string){
    const db = await this.getDbName(); 
    const query = 'SELECT id, name, lotes FROM finca'; 
    
    return CapacitorSQLite.query({
      database: db,
      statement: query,
      values: []
    }).then((response) => {
      let fincas: Finca[] = [];
      for (let i = 0; i < response.values.length; i++) {
        const element = response.values[i];
        let finca = element as Finca;
        fincas.push(finca)
      }
      this.fincas = fincas
      return fincas
    }).catch((error) => {
      console.error('Error fetching banks:', error);
      return Promise.reject(error);
    });
  }
  
  getFincaName(fincaId: string): string {
    const finca = this.fincas.find(fin => String(fin.id) === fincaId);
    return finca ? finca.name : 'Nombre de finca desconocida';
  }
  
  getFincaLote(fincaId: string): number {
    const lotes = this.fincas.find(lot => lot.id === Number(fincaId));
    return lotes ? lotes.lotes: 0
  }
  // ** Cosechas */

  async getCosechas(search?: string) {
    const sql = 'SELECT id, nombre FROM cosecha';
    const db = await this.getDbName();
    
    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) => {
      let cosechas : Cosecha[] = [];
      for (let i = 0; i < response.values.length; i++) {
        const element = response.values[i];
        let cosecha = element as Cosecha;
        cosechas.push(cosecha)
      } 
      return Promise.resolve(cosechas)
    }).catch((error) => {
      console.error('Error al traer las cosechas:', error);
      return Promise.reject(error);
    });
  }

  async getTipoRec(){
    const sql = 'SELECT id, nombre FROM tipoRecoleccion';
    const db = await this.getDbName();

    return CapacitorSQLite.query({
      database: db,
      statement: sql,
      values: []
    }).then((response: capSQLiteValues) => {
      let tipos: TipoRecolec[] = [];
      for (let i = 0; i < response.values.length; i++) {
        const element = response.values[i];
        let tipo = element as TipoRecolec;
        tipos.push(tipo)
      }
      return Promise.resolve(tipos)
    }).catch((error) => {
      console.error('Error al traer las cosechas:', error);
      return Promise.reject(error);
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
