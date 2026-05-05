// src/pacientes/pacientes.controller.ts

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
  ConflictException,
  Query,
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
 */
@ApiTags('Pacientes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Crea un nuevo paciente.
   * Si el email ya existe, lanza un ConflictException que el Frontend
   * debe usar para recuperar al paciente existente y proceder con la cita.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(Paciente, 'Crea un nuevo paciente')
  @ApiBody({ type: CreatePacienteDto })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'El email ya está registrado. El sistema permite recuperar el ID para la cita.',
  })
  async create(
    @Body() createPacienteDto: CreatePacienteDto,
  ): Promise<Paciente> {
    // La lógica de persistencia progresiva se apoya en que el Service
    // ya valida el email. Si falla, el flujo atómico en el Front se detiene
    // y ofrece seleccionar al paciente existente.
    return this.pacientesService.create(createPacienteDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllOperation(
    Paciente,
    'Obtiene los pacientes según rol',
    PacienteResponseDto,
  )
  async findAll(@GetUser() user: any): Promise<Paciente[]> {
    const profesionalId =
      user.rol === 'PROFESIONAL' ? user.idProfesional : undefined;
    return this.pacientesService.findAll(profesionalId);
  }

  @Get('search')
  async search(@Query('term') term: string) {
    return this.pacientesService.searchGlobal(term);
  }

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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOperation(Paciente, 'Actualiza un paciente por su ID')
  async actualiza(
    @Param('id') id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    return await this.pacientesService.actualiza(id, updatePacienteDto);
  }
}
