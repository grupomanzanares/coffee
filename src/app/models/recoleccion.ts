import { Recolector } from "./recolector";

// export class Recoleccion{
//     id: string;                  
//     cosechaId: string;           
//     nit_recolectores: number;    
//     fecha: string ;        
//     finca: string;               
//     lote: string ; 
//     variedad: number ;     
//     tipoRecoleccion: string;   
//     cantidad: number ;     
//     vlrRecoleccion: number ; 
//     observacion: string ;       
//     fecRegistro: string ; 
//     recolector?: Recolector;
// }

export class Recoleccion {
    id: number; 
    cosechaId: number;            
    nit_recolectores: number;     
    fecha: string;                
    finca: string;                
    lote: string;                 
    variedad: number;             
    tipoRecoleccion: string; 
    cantidad: number;             
    vlrRecoleccion: number;       
    observacion: string;          
    fecRegistro: string;          
    recolector?: Recolector;
}