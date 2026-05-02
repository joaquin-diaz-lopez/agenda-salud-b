//src/usuarios/dto/change-password.dto.ts
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la transferencia de datos al cambiar la contraseña.
 * Se utiliza el operador '!' para indicar a TypeScript que estas propiedades
 * serán inicializadas externamente por NestJS al recibir la petición.
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'La contraseña actual del usuario para validar la identidad.',
    example: 'Password123!',
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto.' })
  contrasenaActual!: string; // El '!' elimina el error de falta de inicializador

  @ApiProperty({
    description: 'La nueva contraseña que el usuario desea establecer.',
    example: 'NuevaClave2026*',
    minLength: 6,
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto.' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres.',
  })
  nuevaContrasena!: string; // El '!' elimina el error de falta de inicializador
}
