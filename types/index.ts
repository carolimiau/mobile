export * from './inspection';

export enum UserRole {
  ADMIN = 'Administrador',
  MECHANIC = 'Mecánico',
  USER = 'Usuario',
}

export interface User {
  id: string;
  rut?: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email: string;
  telefono?: string;
  rol?: UserRole;
  fechaCreacion?: string;
  fechaNacimiento?: string;
  saldo?: number;
  foto_url?: string;
}

export interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  fechaCreacion: string;
  userId: string;
  
  // Spanish fields (DB Schema)
  kilometraje?: number;
  valor?: number;
  transmision?: string;
  tipoCombustible?: string;
  combustible?: string;
  tipoCarroceria?: string;
  color?: string;
  descripcion?: string;
  comuna?: string;
  region?: string;
  estado?: string;
  publicationId?: string;
  numeroMotor?: string;
  motor?: string;
  puertas?: number;
  tipoVehiculo?: string;
  mesRevisionTecnica?: string;

  // Optional fields for UI compatibility (Legacy/English)
  price?: number;
  kilometers?: number;
  fuelType?: string;
  transmission?: string;
  description?: string;
  location?: string;
  images?: string[];
  status?: string;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
}

export interface Payment {
  id: string;
  usuarioId: string;
  monto: number;
  metodo: 'Débito' | 'Saldo_Autobox' | 'Transferencia' | 'Efectivo' | 'Webpay';
  estado: 'Confirmado' | 'Incompleto' | 'Cancelado';
  idempotencyKey?: string;
  detalles?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface Message {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  contenido: string;
  vehiculoId?: string;
  leido: boolean;
  fechaCreacion: string;
}