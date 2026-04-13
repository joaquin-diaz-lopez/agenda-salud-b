// src/profesional-servicios/profesional-servicios.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProfesionalServiciosService } from './profesional-servicios.service';
import { CreateProfesionalServicioDto } from './dto/create-profesional-servicio.dto';
import { ProfesionalServicio } from './entities/profesional-servicio.entity';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
} from '../common/decorators/api-operations.decorator';
import { ProfesionalServicioResponseDto } from './dto/profesional-servicio-response.dto';

@Controller('profesional-servicios')
@ApiTags('Profesional Servicios')
export class ProfesionalServiciosController {
  constructor(
    private readonly profesionalServiciosService: ProfesionalServiciosService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(
    ProfesionalServicio,
    'Crea una nueva asociación entre un profesional y un servicio',
    ProfesionalServicioResponseDto,
  )
  async create(
    @Body() createProfesionalServicioDto: CreateProfesionalServicioDto,
  ): Promise<ProfesionalServicio> {
    return this.profesionalServiciosService.create(
      createProfesionalServicioDto,
    );
  }

  @Get()
  @ApiFindAllOperation(
    ProfesionalServicio,
    'Obtiene todas las asociaciones',
    ProfesionalServicioResponseDto,
  )
  async findAll(): Promise<ProfesionalServicio[]> {
    return this.profesionalServiciosService.findAll();
  }

  // --- NUEVO: Obtener servicios de un profesional específico ---
  @Get('profesional/:idProfesional')
  @ApiParam({ name: 'idProfesional', description: 'UUID del profesional' })
  async findByProfesional(@Param('idProfesional') idProfesional: string) {
    return this.profesionalServiciosService.findByProfesional(idProfesional);
  }

  // --- NUEVO: Eliminar una asociación (Desvincular) ---
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'ID de la asociación a eliminar' })
  async remove(@Param('id') id: string) {
    return this.profesionalServiciosService.remove(id);
  }
}
