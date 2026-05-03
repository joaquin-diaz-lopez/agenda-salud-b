import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Paciente } from './entities/paciente.entity';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
} from '../common/decorators/api-operations.decorator';
import { PacienteResponseDto } from './dto/paciente-response.dto';

// Importaciones para la seguridad
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

/**
 * Controlador para la gestión de Pacientes.
 * Expone los endpoints HTTP para realizar operaciones CRUD básicas sobre los pacientes.
 */
@ApiTags('Pacientes')
@ApiBearerAuth() // Indica a Swagger que se requiere un token JWT
@UseGuards(JwtAuthGuard) // Protege todos los endpoints de este controlador
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Crea un nuevo paciente.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(Paciente, 'Crea un nuevo paciente')
  @ApiBody({
    type: CreatePacienteDto,
    description: 'Datos para crear un nuevo paciente.',
    examples: {
      ejemplo1: {
        value: {
          nombre: 'Juan',
          apellido: 'Pérez',
          fechaNacimiento: '1990-05-21',
          telefono: '55-1234-5678',
          email: 'juan.perez@example.com',
          direccion: 'Calle Falsa 123, Ciudad de México',
          idUsuario: '123e4567-e89b-12d3-a456-426614174000',
        },
        description: 'Ejemplo de creación de un paciente con todos los campos.',
      },
      ejemplo2: {
        value: {
          nombre: 'Ana',
          apellido: 'García',
        },
        description:
          'Ejemplo de creación de un paciente con solo los campos obligatorios.',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Conflicto con email o usuario.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async create(
    @Body() createPacienteDto: CreatePacienteDto,
  ): Promise<Paciente> {
    return this.pacientesService.create(createPacienteDto);
  }

  /**
   * Obtiene los pacientes.
   * Si el usuario es PROFESIONAL, solo verá pacientes vinculados a sus citas.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllOperation(
    Paciente,
    'Obtiene los pacientes según el rol del usuario logueado',
    PacienteResponseDto,
  )
  async findAll(@GetUser() user: any): Promise<Paciente[]> {
    // Si el usuario es un profesional, extraemos su ID de profesional para filtrar
    const profesionalId =
      user.rol === 'PROFESIONAL' ? user.idProfesional : undefined;

    return this.pacientesService.findAll(profesionalId);
  }

  /**
   * Obtiene un paciente específico por su ID.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneOperation(
    Paciente,
    'Obtiene un paciente por su ID',
    PacienteResponseDto,
  )
  async findOne(@Param('id') id: string): Promise<Paciente | null> {
    return this.pacientesService.findOne(id);
  }

  /**
   * Actualiza parcialmente un paciente existente.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOperation(Paciente, 'Actualiza un paciente por su ID')
  @ApiBody({
    type: UpdatePacienteDto,
    description: 'Datos parciales para actualizar un paciente.',
    examples: {
      ejemplo1: {
        value: {
          telefono: '55-9876-5432',
          direccion: 'Av. Siempre Viva 742',
        },
        description: 'Ejemplo de actualización de teléfono y dirección.',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email en uso.' })
  async actualiza(
    @Param('id') id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    return await this.pacientesService.actualiza(id, updatePacienteDto);
  }
}
