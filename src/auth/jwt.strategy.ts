// src/auth/jwt.strategy.ts
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  /**
   * Valida el payload decodificado del JWT.
   * El objeto retornado aquí es el que `@GetUser()` extraerá de 'req.user'.
   */
  validate(payload: JwtPayload) {
    // Retornamos un objeto enriquecido con el idProfesional
    // para que el controlador pueda filtrar los pacientes y citas.
    return {
      id: payload.sub,
      nombreUsuario: payload.nombreUsuario,
      idRol: payload.idRol,
      rol: payload.nombreRol, // Mantenemos consistencia con la propiedad 'rol' usada en el controlador
      idProfesional: payload.idProfesional, // <--- CAMBIO CLAVE
    };
  }
}
