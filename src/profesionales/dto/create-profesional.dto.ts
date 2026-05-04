// src/profesionales/dto/create-profesional.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO (Data Transfer Object) para la creación de un nuevo Profesional.
 * Define la estructura y las reglas de validación para los datos
 * esperados al crear un registro en la tabla 'profesionales'.
 */
export class CreateProfesionalDto {
  /**
   * El ID (UUID) del usuario asociado a este profesional.
   * Es obligatorio, ya que cada profesional debe tener un usuario en el sistema.
   */
  @ApiProperty({ description: 'Identificador único del usuario asociado' })
  @IsUUID()
  @IsNotEmpty()
  idUsuario: string;

  /**
   * Nombre del profesional.
   * Es obligatorio, una cadena de texto y con una longitud máxima de 100 caracteres.
   */
  @ApiProperty({ description: 'Nombre del profesional' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  /**
   * Apellido del profesional.
   * Es obligatorio, una cadena de texto y con una longitud máxima de 100 caracteres.
   */
  @ApiProperty({ description: 'Apellido del profesional' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellido: string;

  /**
   * Dirección de correo electrónico del profesional.
   * Debe ser un formato de email válido. Aunque en la entidad es nullable,
   * generalmente se hace obligatorio para la creación de un profesional.
   */
  @ApiProperty({
    description: 'Dirección de correo electrónico del profesional',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(150)
  email: string;

  /**
   * Número de teléfono del profesional.
   * Es opcional y con una longitud máxima de 20 caracteres.
   */
  @ApiProperty({
    description: 'Número de teléfono del profesional',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  /**
   * Especialidad médica o de salud del profesional.
   * Es opcional y con una longitud máxima de 100 caracteres.
   */
  @ApiProperty({
    description: 'Especialidad médica o de salud del profesional',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  especialidad?: string;

  /**
   * El ID (UUID) del centro de salud al que se asocia el profesional.
   * Es opcional, permitiendo profesionales sin un centro de salud asignado inicialmente.
   */
  @ApiProperty({
    description: 'Identificador único del centro de salud asociado',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  idCentroDeSalud?: string;

  @ApiProperty({
    description: 'Hora de inicio de jornada base',
    example: '08:00',
    required: false,
    default: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'La hora de inicio debe tener formato HH:mm',
  })
  horaInicioBase?: string;

  @ApiProperty({
    description: 'Hora de fin de jornada base',
    example: '16:00',
    required: false,
    default: '16:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'La hora de fin debe tener formato HH:mm',
  })
  horaFinBase?: string;
}
