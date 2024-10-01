import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteChanges, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Recolector } from '../models/recolector';
import { Statement } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class SqliteManagerService {

  private isWeb: boolean;
  private DB_SETUP_KEY = 'first_db_setup'
  private DB_NAME_KEY = 'db_name'
  private dbName: string;
  public dbReady: BehaviorSubject<boolean>;
  documentos: { id: number, name: string }[] = [];
  bancos: { id: number, name: string }[] = [];
  contratos: {id: number, name: string} [] = [];

  constructor(private alertCtrl: AlertController, private http: HttpClient) {
    this.isWeb = false;
    this.dbName = '';
    this.dbReady = new BehaviorSubject(false); 
  }

  async init(){
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if (info.platform == 'android') {
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
      this.isWeb = true;
      await sqlite.initWebStore();
    }

    this.setupDataBase();
  }

  async setupDataBase(){
    const dbSetupDone = await Preferences.get({key: this.DB_SETUP_KEY})
    if (!dbSetupDone.value) {
      this.downloadDataBase();
      console.log("dowland")
    }else{
      const db = await this.getDbName();
      await CapacitorSQLite.createConnection({database: db});
      await CapacitorSQLite.open({database: db})
      this.dbReady.next(true);
    }
  }

  downloadDataBase(){
    console.log("Iniciando descarga de base de datos...");
    this.http.get('assets/db/db.json').subscribe(async(jsonExport: JsonSQLite) =>{
      const jsonString = JSON.stringify(jsonExport);
      console.log("JSON Exportado:", jsonString);
      const isValid = await CapacitorSQLite.isJsonValid({jsonstring: jsonString});
      console.log("Validación de JSON:", isValid.result);
      if (isValid.result){
        this.dbName = jsonExport.database;
        await CapacitorSQLite.importFromJson({jsonstring: jsonString});
        console.log("Importación completada");
        await CapacitorSQLite.createConnection({database: this.dbName});
        await CapacitorSQLite.open({database: this.dbName});
  
        await Preferences.set({key: this.DB_SETUP_KEY, value: '1'});
        await Preferences.set({key: this.DB_NAME_KEY, value: this.dbName});
        console.log("Base de datos lista");
        this.dbReady.next(true);
      }else{
        console.log("BD no valida");
      }
    })
  }

//   async resetDatabase() {
//   const db = await this.getDbName();
//   console.log("Eliminando base de datos:", db);
//   await CapacitorSQLite.deleteDatabase({ database: db });
//   await Preferences.remove({ key: this.DB_SETUP_KEY });
//   console.log("Base de datos eliminada. Re-iniciando importación...");
//   this.downloadDataBase();
// }


  async getDbName(){
    if (!this.dbName) {
      const db = await Preferences.get({key: this.DB_NAME_KEY});
      this.dbName = db.value;
    }
    return this.dbName;
  }

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
    let sql = 'INSERT INTO recolectores (nit, tipo_Identificacion, nombre, nombre1, nombre2, apellido1, apellido2, tipo_Contrato, observacion, banco, cuenta_bancaria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
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
            recolector.cuenta_bancaria
          ]
        }
      ]
    }).then((changes: capSQLiteChanges) => {
      if (this.isWeb) {
        CapacitorSQLite.saveToStore({ database: db });
      }
      return changes;
    })
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
}
