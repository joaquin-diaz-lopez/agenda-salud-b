// src/citas/citas.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { Cita } from './entities/cita.entity';
import { CitaResponseDto } from './dto/cita-response.dto';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
} from '../common/decorators/api-operations.decorator';

@Controller('citas')
@ApiTags('Citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /**
   * Crea una nueva cita.
   * Segundo paso del 'Flujo Atómico'. Si el slot está ocupado,
   * el paciente creado en el paso anterior persiste.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(Cita, 'Agenda una nueva cita', CitaResponseDto)
  @ApiBody({ type: CreateCitaDto })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Slot ocupado. El paciente ya fue creado con éxito y no se perderá.',
  })
  async create(@Body() createCitaDto: CreateCitaDto): Promise<Cita> {
    return this.citasService.create(createCitaDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllOperation(Cita, 'Obtiene todas las citas', CitaResponseDto)
  async findAll(): Promise<Cita[]> {
    return this.citasService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneOperation(Cita, 'Obtiene una cita por su ID', CitaResponseDto)
  async findOne(@Param('id') id: string): Promise<Cita | null> {
    return this.citasService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOperation(
    Cita,
    'Actualiza parcialmente una cita por su ID',
    CitaResponseDto,
  )
  async actualiza(
    @Param('id') id: string,
    @Body() updateCitaDto: UpdateCitaDto,
  ): Promise<Cita> {
    return await this.citasService.actualiza(id, updateCitaDto);
  }
}
