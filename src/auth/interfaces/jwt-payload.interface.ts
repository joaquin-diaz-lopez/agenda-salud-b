// src/auth/interfaces/jwt-payload.interface.ts

/**
 * Define la estructura de la carga útil (payload) del JSON Web Token.
 */
export interface JwtPayload {
  /** ID del Usuario (entidad Usuario) */
  sub: string;

  /** Nombre de usuario */
  nombreUsuario: string;

  /** ID del Rol */
  idRol: string;

  /** Nombre del Rol (ej. 'Administrador', 'Profesional', 'Paciente') */
  nombreRol: string;

  /**
   * ID del Profesional (entidad Profesional).
   * Solo presente si el usuario está vinculado a un perfil profesional.
   */
  idProfesional?: string; // <--- NUEVO CAMPO

  iat?: number;
  exp?: number;
}
