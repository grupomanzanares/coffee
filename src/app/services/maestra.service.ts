import { Injectable } from '@angular/core';
import { Contrato } from '../models/contrato';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
import { forkJoin, lastValueFrom, map, Observable } from 'rxjs';
import { SqliteManagerService } from './sqlite-manager.service';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Maestra } from '../models/maestra';

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
  obtenerVps(endPoint: string): Observable<Maestra[]> {
    return this.http.get<Maestra[]>(`${this.apiUrl}${endPoint}`);
  }

  // Obtener datos locales desde db.json
  async obtenerDtLocal(tabla: string): Promise<Maestra[]> {
    const db = await this.sqliteManagerService.getDbName();
    const sql = `SELECT * FROM ${tabla}`

    try {
      const result = await CapacitorSQLite.query({
        database: db,
        statement: sql,
        values: []
      });
      if (result.values) {
        const contratos = await result.values.map(row => ({
          id: row.id,
          codigo: row.codigo,
          nombre: row.nombre,
          descripcion: row.descripcion,
          habilitado: row.habilitado,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          usuario: row.usuario,
          usuarioMod: row.usuarioMod
        }));
        return contratos
      }else{
        throw new Error("No se encontraron datos en la base de datos.");
      }
    } catch (error) {
      console.error('Error al consultar los datos locales', error);
      throw error;
    }
  }

  // Comparar los datos obtenidos del VPS con los datos locales
  comparacion(endPoint: string, tabla: string): Observable<{ update: Maestra[], create: Maestra[] }> {
    return forkJoin({
      vpsDatos: this.obtenerVps(endPoint),
      localDatos: this.obtenerDtLocal(tabla)
    }).pipe(
      map(result => {
        const { vpsDatos, localDatos } = result;

        if (localDatos.length === 0) {
          console.log('No hay datos locales, todos los datos del VPS serán creados.');
          return { update: [], create: vpsDatos };
        }
  
        
        // Encontrar datos que necesitan actualizarse
        const update = vpsDatos.filter(vpsDato => {
          const localDato = localDatos.find(localDato => localDato.id === vpsDato.id);
          if (!localDato) return false;
          
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

        // Encontrar datos que necesitan crearse
        const create = vpsDatos.filter(vpsDato => !localDatos.find(localDato => localDato.id === vpsDato.id));

        return { update, create };
      })
    );
  }
  

  // Función para actualizar los datos con diferencias
  async update(datosDiferentes: Maestra[], tabla: string) {
    console.log('Datos diferentes recibidos:', datosDiferentes);
    if (datosDiferentes.length === 0) {
      console.log('No hay datos diferentes para actualizar.');
      return;
    }
    
    const db = await this.sqliteManagerService.getDbName();
    
    const sql = `UPDATE ${tabla} SET codigo = ?, nombre = ?, descripcion = ?, habilitado = ?, createdAt = ?, updatedAt = ?, usuario = ?, usuarioMod = ? WHERE id = ?`;
  
    try {
      for (const contrato of datosDiferentes) {
        // Compara los campos y construye el mensaje personalizado
        let cambios = [];
        if (contrato.codigo !== undefined) cambios.push('codigo');
        if (contrato.nombre !== undefined) cambios.push('nombre');
        if (contrato.descripcion !== undefined) cambios.push('descripcion');
        if (contrato.habilitado !== undefined) cambios.push('habilitado');
        if (contrato.createdAt !== undefined) cambios.push('createdAt');
        if (contrato.updatedAt !== undefined) cambios.push('updatedAt');
        if (contrato.usuario !== undefined) cambios.push('usuario');
        if (contrato.usuarioMod !== undefined) cambios.push('usuarioMod');
  
        // Ejecutar la actualización
        await CapacitorSQLite.executeSet({
          database: db,
          set: [
            {
              statement: sql,
              values: [
                contrato.codigo || null, 
                contrato.nombre || null, 
                contrato.descripcion || null, 
                contrato.habilitado || 1, 
                contrato.createdAt || null, 
                contrato.updatedAt || null, 
                contrato.usuario || null, 
                contrato.usuarioMod || null, 
                contrato.id
              ]
            }
          ]
        });
  
        // Genera el mensaje basado en los cambios
        if (cambios.length > 0) {
          console.log(`Datos con id ${contrato.id} actualizado exitosamente. Campos actualizados: ${cambios.join(', ')}.`);
        } else {
          console.log(`Datos con id ${contrato.id} no requiere actualización.`);
        }
      }
    } catch (error) {
      console.error('Error al actualizar los contratos:', error);
    }
  }

  async create(datosParaCrear: Contrato[], tabla: string) {
    const db = await this.sqliteManagerService.getDbName();
    const insertSql = `INSERT INTO ${tabla} (id, codigo, nombre, descripcion, habilitado, usuario, createdAt, updatedAt, usuarioMod) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    try {
      for (const contrato of datosParaCrear) {

        const exsContrato = await CapacitorSQLite.query({
          database: db,
          statement: `SELECT id FROM ${tabla} WHERE id = ?`,
          values: [contrato.id]
        })

        if (exsContrato.values.length === 0) {
          // Si no existe, insertamos el contrato
          await CapacitorSQLite.executeSet({
            database: db,
            set: [{
              statement: insertSql,
              values: [
                contrato.id, 
                contrato.codigo, 
                contrato.nombre, 
                contrato.descripcion, 
                contrato.habilitado || 1, 
                contrato.usuario, 
                contrato.createdAt, 
                contrato.updatedAt, 
                contrato.usuarioMod
              ]
            }]
          });
          console.log(`Contrato con id ${contrato.id} creado exitosamente.`, contrato);
        } else {
          console.log(`Contrato con id ${contrato.id} ya existe, omitiendo la inserción.`);
        }
      }
    } catch (error) {
      console.error('Error al crear nuevos datos:', error);
    }
  }

  async sincronizar(endPoint: string, tabla: string) {
    try {
      const { update, create } = await lastValueFrom(this.comparacion(endPoint, tabla));

      if (update.length > 0) {
        await this.update(update, tabla);
        console.log('Datos actualizados correctamente.');
      }else{
        console.log('No hay datos que actualizar')
      }

      if (create.length > 0) {
        await this.create(create, tabla);
        console.log('Datos nuevos insertados correctamente.');
      }

      if (update.length === 0 && create.length === 0) {
        console.log('No hay cambios para aplicar.');
      }

    } catch (error) {
      console.error('Error en la sincronización:', error);
    }
  }
}