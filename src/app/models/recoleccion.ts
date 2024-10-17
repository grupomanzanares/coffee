export class Recoleccion {
    id: string; 
    cosechaId: number;            
    nit_recolectores: number;     
    fecha: string;                
    finca: string;                
    lote: number;                 
    variedad: number;             
    tipoRecoleccion: string; 
    cantidad: number;             
    vlrRecoleccion: number;       
    observacion: string;          
    fecRegistro: string;          
    recolector?: {
        nit: number;
        nombre1: string;
        apellido1: string;
      };      
}