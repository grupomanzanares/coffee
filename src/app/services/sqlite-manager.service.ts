import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite, capSQLiteValues, JsonSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { Recolector } from '../models/recolector';

@Injectable({
  providedIn: 'root'
})
export class SqliteManagerService {

  private isWeb: boolean;
  private DB_SETUP_KEY = 'first_db_setup'
  private DB_NAME_KEY = 'db_name'
  private dbName: string;
  public dbReady: BehaviorSubject<boolean>;

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
    }else{
      const db = await this.getDbName();
      await CapacitorSQLite.createConnection({database: db});
      await CapacitorSQLite.open({database: db})
      this.dbReady.next(true);
    }
  }

  downloadDataBase(){
    this.http.get('assets/db/db.json').subscribe(async(jsonExport: JsonSQLite) =>{
      const jsonString = JSON.stringify(jsonExport);
      const isValid = await CapacitorSQLite.isJsonValid({jsonstring: jsonString})
      if (isValid.result){
        this.dbName = jsonExport.database;
        await  CapacitorSQLite.importFromJson({jsonstring: jsonString})
        await CapacitorSQLite.createConnection({database: this.dbName});
        await CapacitorSQLite.open({database: this.dbName})

        await Preferences.set({key: this.DB_SETUP_KEY, value: '1'})
        await Preferences.set({key: this.DB_NAME_KEY, value: this.dbName})
        this.dbReady.next(true);
      }else{
        console.log("BD no valida")
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

  async getRecolectores(search?: string){
    let sql = "SELECT * FROM recolectores WHERE active = 1 ";
    if (search) {
      sql += `AND (upper(name) LIKE '%${search.toLocaleUpperCase()}%' OR upper(surname) LIKE '%${search.toLocaleLowerCase()}%')`
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
}
