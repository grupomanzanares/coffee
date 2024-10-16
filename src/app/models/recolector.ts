export class Recolector {
    nit: number;
    tipo_Identificacion: number;
    nombre: string;
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    rut: number;
    active: number;
    tipo_Contrato: number;
    observacion: string;
    banco: number;
    cuenta_bancaria: string;
    usuario: string;
    fec_registro: string;
  }
  

  /**
   *  Nombre debe dejar colocar espacios porque es el nombre completo 
   *  Falta el chulito de Rut:  por si tiene o no tiene rut  es boolean   1: si tiene 0: no tiene
   *  Falta el chulito de habilitado:  cuando se cree predeterminado 1
   *  Falta los campos de usuariomod y fecregistro mod
   * 
   * 
   * CREATE TABLE [dbo].[Recolectores](
      [Nit] [varchar](15) NOT NULL,
      [TipoIdentificacionId] [int] NOT NULL,
      [Nombre] [varchar](60) NULL,
      [Nombre1] [varchar](45) NULL,
      [Nombre2] [varchar](45) NULL,
      [Apellido1] [varchar](45) NULL,
      [Apellido2] [varchar](45) NULL,
      [Rut] [bit] NULL,
      [Habilitado] [bit] NULL,
      [TipoContratoId] [int] NOT NULL,
      [Observacion] [varchar](100) NULL,
      [BancoId] [int] NOT NULL,
      [CuentaBancaria] [varchar](45) NULL,
      [Usuario] [varchar](15) NULL,
      [FecRegistro] [datetime] NULL,
      [UsuarioMod] [varchar](15) NULL,
      [FecRegistroMod] [datetime] NULL,
    PRIMARY KEY CLUSTERED 
    (
      [Nit] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
    ) ON [PRIMARY]
   * 
   * 
   * 
   * 
   * 
   */