// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida las credenciales de un usuario.
   */
  async validateUsuario(
    nombreUsuario: string,
    contrasena: string,
  ): Promise<Partial<Usuario> | null> {
    const usuario =
      await this.usuariosService.findByUsernameForAuth(nombreUsuario);

    if (!usuario || !usuario.contrasena) {
      return null;
    }

    const esContrasenaValida = await bcrypt.compare(
      contrasena,
      usuario.contrasena,
    );

    if (esContrasenaValida) {
      const { contrasena, ...resultado } = usuario;
      return resultado;
    }
    return null;
  }

  /**
   * Genera un token JWT incluyendo el idProfesional si aplica.
   */
  async login(usuario: Usuario) {
    // 1. Aseguramos que el usuario tenga el rol y la relación profesional cargada
    // Si no están, los buscamos.
    let usuarioCompleto = usuario;
    if (
      !usuario.rol ||
      (usuario.rol.nombre === 'PROFESIONAL' && !usuario.profesional)
    ) {
      const buscado = await this.usuariosService.buscarPorId(usuario.id);
      if (!buscado) {
        throw new UnauthorizedException(
          'No se pudo obtener la información del usuario.',
        );
      }
      usuarioCompleto = buscado;
    }

    // 2. Preparamos el payload básico
    const payload: JwtPayload = {
      sub: usuarioCompleto.id,
      nombreUsuario: usuarioCompleto.nombreUsuario,
      idRol: usuarioCompleto.rol.id,
      nombreRol: usuarioCompleto.rol.nombre,
    };

    // 3. Si es PROFESIONAL, inyectamos su ID de profesional en el payload
    // Esto es lo que usará el controlador para filtrar la lista de pacientes
    if (
      usuarioCompleto.rol.nombre === 'PROFESIONAL' &&
      usuarioCompleto.profesional
    ) {
      payload.idProfesional = usuarioCompleto.profesional.id;
    }

    return {
      access_token: this.jwtService.sign(payload),
      nombreUsuario: usuarioCompleto.nombreUsuario,
      nombreRol: usuarioCompleto.rol.nombre,
      // Opcional: devolver el idProfesional también en la respuesta plana para el frontend
      idProfesional: payload.idProfesional,
    };
  }
}
