import { Injectable } from '@angular/core';
import { Contrato } from '../models/contrato';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
import { forkJoin, map, Observable } from 'rxjs';
import { SqliteManagerService } from './sqlite-manager.service';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class MaestraService {

  apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient, 
    private sqliteManagerService: SqliteManagerService
  ) { }

  // Obtener datos desde el VPS
  obtenerVps(endPoint: string): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(`${this.apiUrl}${endPoint}`);
  }

  // Obtener datos locales desde db.json
  obtenerDtLocal(): Observable<Contrato[]> {
    return this.http.get<any>('assets/db/db.json').pipe(
      map((db) => {
        const tpContratoTable = db.tables.find((table: any) => table.name === 'tp_contrato');
        return this.transformarDatosLocales(tpContratoTable.values);
      })
    );
  }

  // Transformar los datos de 'tp_contrato' a objetos 'Contrato'
  private transformarDatosLocales(datos: any[]): Contrato[] {
    return datos.map(dato => ({
      id: dato[0],
      codigo: dato[1],
      nombre: dato[2],
      descripcion: dato[3],
      habilitado: dato[4],
      usuario: dato[5],
      createdAt: dato[6],
      updatedAt: dato[7],
      usuarioMod: dato[8]
    }));
  }

  // Comparar los datos obtenidos del VPS con los datos locales
  comparacion(endPoint: string): Observable<Contrato[]> {
    return forkJoin({
      vpsDatos: this.obtenerVps(endPoint),
      localDatos: this.obtenerDtLocal()
    }).pipe(
      map((result) => {
        const { vpsDatos, localDatos } = result;
      
        console.log('Datos del VPS: ', vpsDatos);
        console.log('Datos locales: ', localDatos);
  
        const datosDiferentes = vpsDatos.filter(vpsDato => {
          const localDato = localDatos.find(localDato => localDato.id === vpsDato.id);
      
          if (!localDato) {
            return true; // Si no hay dato local, es diferente
          }
      
          return (
            vpsDato.codigo !== localDato.codigo ||
            vpsDato.nombre !== localDato.nombre || 
            vpsDato.descripcion !== localDato.descripcion ||
            vpsDato.habilitado !== localDato.habilitado ||
            vpsDato.createdAt !== localDato.createdAt ||
            vpsDato.updatedAt !== localDato.updatedAt ||
            vpsDato.usuario !== localDato.usuario ||
            vpsDato.usuarioMod !== localDato.usuarioMod
          );
        });
      
        console.log('Diferencias encontradas: ', datosDiferentes);
        return datosDiferentes;
      })
    );
  }
  

  // Función para actualizar los datos con diferencias
  async update(datosDiferentes: Contrato[]) {
    if (datosDiferentes.length === 0) {
      console.log('No hay datos diferentes para actualizar.');
      return;
    }
  
    const db = await this.sqliteManagerService.getDbName();
  
    const sql = `UPDATE tp_contrato 
                 SET codigo = ?, nombre = ?, descripcion = ?, habilitado = ?, createdAt = ?, updatedAt = ?, usuario = ?, usuarioMod = ? 
                 WHERE id = ?`;
  
    try {
      for (const contrato of datosDiferentes) {
        // Ejecutar la actualización
        await CapacitorSQLite.executeSet({
          database: db,
          set: [
            {
              statement: sql,
              values: [
                contrato.codigo, 
                contrato.nombre, 
                contrato.descripcion, 
                contrato.habilitado, 
                contrato.createdAt, 
                contrato.updatedAt, 
                contrato.usuario, 
                contrato.usuarioMod, 
                contrato.id
              ]
            }
          ]
        });
  
        // Después de la actualización, consultar los datos
        const consultaSql = `SELECT * FROM tp_contrato WHERE id = ?`;
        const resultado = await CapacitorSQLite.query({
          database: db,
          statement: consultaSql,
          values: [contrato.id]
        });
        console.log(`Datos después de actualizar el contrato con id ${contrato.id}:`, resultado);
      }
  
      console.log('Actualización completada exitosamente.');
  
      // Opcional: Obtener los datos locales actualizados al final
      const nuevosDatosLocales = await this.obtenerDtLocal().toPromise();
      console.log('Nuevos datos locales después de la actualización: ', nuevosDatosLocales);
  
    } catch (error) {
      console.error('Error al actualizar los contratos:', error);
    }
  }
  
  
}
