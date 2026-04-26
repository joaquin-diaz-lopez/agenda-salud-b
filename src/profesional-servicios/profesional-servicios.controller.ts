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
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

  // --- REFACTORIZADO: Obtener servicios de un profesional específico ---
  @Get('profesional/:idProfesional')
  @ApiOperation({
    summary: 'Obtiene todos los servicios que ofrece un profesional específico',
  })
  @ApiParam({
    name: 'idProfesional',
    description: 'UUID del profesional',
    example: 'b1c2d3e4-f5a6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de servicios del profesional recuperada con éxito.',
    type: ProfesionalServicio,
    isArray: true,
  })
  async findByProfesional(
    @Param('idProfesional', ParseUUIDPipe) idProfesional: string,
  ): Promise<ProfesionalServicio[]> {
    return this.profesionalServiciosService.findByProfesional(idProfesional);
  }

  // --- REFACTORIZADO: Eliminar una asociación (Desvincular) ---
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Elimina una asociación (desvincula un servicio de un profesional)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la asociación a eliminar',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'La asociación ha sido eliminada con éxito.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.profesionalServiciosService.remove(id);
  }
}
