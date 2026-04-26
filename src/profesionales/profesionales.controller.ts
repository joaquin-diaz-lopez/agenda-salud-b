// src/profesionales/profesionales.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfesionalesService } from './profesionales.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Profesional } from './entities/profesional.entity';
import { Request as ExpressRequest } from 'express';

// --- CONTROL DE ACCESO y SWAGGER ---
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
} from '../common/decorators/api-operations.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

interface CustomRequest extends ExpressRequest {
  user: JwtPayload;
}

@ApiTags('Profesionales')
@ApiBearerAuth() // Activado para que Swagger pida el token
@Controller('profesionales')
// Puedes descomentar la siguiente línea si quieres proteger TODO el controlador
// @UseGuards(JwtAuthGuard, RolesGuard)
export class ProfesionalesController {
  constructor(private readonly profesionalesService: ProfesionalesService) {}

  /**
   * Crea un nuevo profesional.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador') // Solo admin suele crear perfiles de personal
  @ApiCreateOperation(Profesional, 'Crea un nuevo profesional')
  async create(
    @Body() createProfesionalDto: CreateProfesionalDto,
  ): Promise<Profesional> {
    return this.profesionalesService.create(createProfesionalDto);
  }

  /**
   * Obtiene todos los profesionales.
   */
  @Get()
  @ApiFindAllOperation(Profesional, 'Obtiene todos los profesionales')
  async findAll(): Promise<Profesional[]> {
    return this.profesionalesService.findAll();
  }

  /**
   * Endpoint para obtener el perfil del usuario logueado.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obtiene los datos del perfil logueado' })
  me(@Request() req: CustomRequest) {
    return {
      usuarioId: req.user.sub,
      rol: req.user.nombreRol,
      nombreUsuario: req.user.nombreUsuario,
      mensaje: 'Acceso y token válidos.',
    };
  }

  /**
   * Obtiene un profesional específico por su ID.
   */
  @Get(':id')
  @ApiFindOneOperation(Profesional, 'Obtiene un profesional por su ID')
  async findOne(@Param('id') id: string): Promise<Profesional | null> {
    return this.profesionalesService.findOne(id);
  }

  /**
   * Actualiza parcialmente un profesional existente.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Profesional')
  @ApiUpdateOperation(Profesional, 'Actualiza un profesional existente')
  async actualiza(
    @Param('id') id: string,
    @Body() updateProfesionalDto: UpdateProfesionalDto,
  ): Promise<Profesional> {
    return await this.profesionalesService.actualiza(id, updateProfesionalDto);
  }

  /**
   * Elimina un profesional de la base de datos.
   * NUEVO ENDPOINT.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un profesional por su ID' })
  @ApiResponse({
    status: 204,
    description: 'Profesional eliminado correctamente',
  })
  @ApiResponse({ status: 404, description: 'Profesional no encontrado' })
  async elimina(@Param('id') id: string): Promise<void> {
    return await this.profesionalesService.elimina(id);
  }

  // Se usó para crear la Agenda-profesional de los profesionales que se registraron
  // antes de que se automatizara la creación de la Agenda al registrar el Profesional.
  //  @Post('reparar-agendas')
  //  async reparar() {
  //    return await this.profesionalesService.repararAgendasFaltantes();
  //  }
}
