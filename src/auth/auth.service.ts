// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service'; // Asegúrate de que esta ruta sea correcta
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // Importa la interfaz JwtPayload
import { Usuario } from '../usuarios/entities/usuario.entity'; // Importa la entidad Usuario

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales de un usuario.
   * @param nombreUsuario El nombre de usuario.
   * @param contrasena La contraseña en texto plano.
   * @returns El objeto de usuario sin la contraseña si es válido, o null si no.
   */
  async validateUsuario(
    nombreUsuario: string,
    contrasena: string,
  ): Promise<Partial<Usuario> | null> {
    const usuario =
      await this.usuariosService.findByUsernameForAuth(nombreUsuario);
    if (!usuario) {
      return null;
    }
    if (!usuario.contrasena) {
      // Esto solo debería ocurrir si la consulta falla, pero es un buen control
      return null;
    }
    const esContrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena,
    );
    if (esContrasenaValida) {
      // Retorna el usuario sin la contraseña para evitar exponerla
      const { contrasena, ...resultado } = usuario;
      return resultado;
    }
    return null;
  }

  /**
   * Genera un token JWT para un usuario validado.
   * @param usuario El objeto de usuario validado.
   * @returns Un objeto con el token de acceso.
   */
  async login(usuario: Usuario) {
    // Asegúrate de que el usuario tenga la propiedad 'rol' cargada (eager: true en Usuario.rol)
    // o busca el rol si no está cargado.
    if (!usuario.rol) {
      // Esto no debería ocurrir si 'eager: true' está en la relación del rol en Usuario.entity.ts
      // Pero es una buena práctica manejarlo o asegurarse de que el rol se carga.
      const usuarioConRol = await this.usuariosService.buscarPorId(usuario.id); // Asegúrate de implementar buscarPorId
      if (usuarioConRol) {
        usuario = usuarioConRol;
      } else {
        throw new UnauthorizedException(
          'No se pudo obtener la información del rol del usuario.',
        );
      }
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      idRol: usuario.rol.id, // Accede al ID del rol
      nombreRol: usuario.rol.nombre, // Accede al nombre del rol
    };

    return {
      access_token: this.jwtService.sign(payload),
      nombreUsuario: usuario.nombreUsuario,
      nombreRol: usuario.rol.nombre,
    };
  }
}
