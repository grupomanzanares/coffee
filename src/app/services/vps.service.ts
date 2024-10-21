import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
import { Observable } from 'rxjs';
import { Maestra } from '../models/maestra';


@Injectable({
  providedIn: 'root'
})
export class VpsService {

  apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  obtener(endPoint: string): Observable<Maestra[]>{
    return this.http.get<Maestra[]>(`${this.apiUrl}${endPoint}`);
  }


}
