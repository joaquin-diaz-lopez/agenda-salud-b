// src/profesionales/dto/profesional-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta al retornar un Profesional.
 * Expone únicamente los datos esenciales y públicos.
 */
export class ProfesionalResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Identificador único del profesional (UUID).',
  })
  id: string;

  // Omitimos idUsuario para mayor limpieza, ya que el profesional ya tiene su propio ID
  // Si se requiere el ID del usuario asociado, se podría incluir, pero no es esencial aquí.

  @ApiProperty({ example: 'Dr. Juan', description: 'Nombre del profesional.' })
  nombre: string;

  @ApiProperty({
    example: 'Pérez García',
    description: 'Apellido del profesional.',
  })
  apellido: string;

  @ApiProperty({
    example: 'juan.perez@example.com',
    description: 'Dirección de correo electrónico.',
    nullable: true,
  })
  email: string;

  @ApiProperty({
    example: '55-1234-5678',
    description: 'Número de teléfono.',
    nullable: true,
  })
  telefono: string;

  @ApiProperty({
    example: 'Cardiología',
    description: 'Especialidad del profesional.',
    nullable: true,
  })
  especialidad: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Identificador del centro de salud asociado.',
    nullable: true,
  })
  idCentroDeSalud: string;

  @ApiProperty({
    example: '08:00',
    description: 'Hora de inicio base configurada.',
  })
  horaInicioBase: string;

  @ApiProperty({
    example: '16:00',
    description: 'Hora de fin base configurada.',
  })
  horaFinBase: string;

  // NOTA: Omitimos las relaciones complejas (usuario, agenda, citas, profesionalServicios)
  // ya que este DTO se usa a menudo para anidamiento y no debe ser recursivo.
}
