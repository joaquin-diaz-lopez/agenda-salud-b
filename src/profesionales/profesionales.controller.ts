// src/profesionales/profesionales.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProfesionalesService } from './profesionales.service';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { Profesional } from './entities/profesional.entity';
import { Request as ExpressRequest } from 'express';
// --- NUEVAS IMPORTACIONES PARA EL CONTROL DE ACCESO y SWAGGER ---
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Para asegurar que el usuario esté autenticado
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { RolesGuard } from '../common/guards/roles.guard'; // Tu guard de roles personalizado
import { Roles } from '../common/decorators/roles.decorator'; // Tu decorador de roles personalizado
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
} from '../common/decorators/api-operations.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
interface CustomRequest extends ExpressRequest {
  user: JwtPayload;
}
/**
 * Controlador para la gestión de Profesionales.
 * Expone los endpoints HTTP para realizar operaciones CRUD básicas sobre los profesionales.
 */
@ApiTags('Profesionales')
//@ApiBearerAuth() // Indica que este controlador requiere un token JWT para acceder a sus rutas
@Controller('profesionales')
//@UseGuards(JwtAuthGuard, RolesGuard) // Aplica JwtAuthGuard y RolesGuard a TODAS las rutas de este controlador
export class ProfesionalesController {
  constructor(private readonly profesionalesService: ProfesionalesService) {}

  /**
   * Crea un nuevo profesional.
   * SOLO ACCESIBLE para roles 'Administrador' o 'Profesional'.
   * @param createProfesionalDto El DTO con los datos para crear el profesional.
   * @returns El profesional recién creado.
   */
  @Post()
  @ApiCreateOperation(Profesional, 'Crea un nuevo profesional')
  //@Roles('Administrador', 'Profesional') // <-- ¡Aquí usamos tu decorador!
  async create(
    @Body() createProfesionalDto: CreateProfesionalDto,
  ): Promise<Profesional> {
    return this.profesionalesService.create(createProfesionalDto);
  }

  /**
   * Obtiene todos los profesionales.
   * Accesible para todos los usuarios autenticados (no requiere roles específicos más allá del JWT).
   * @returns Un array de todos los profesionales.
   */
  @Get()
  @ApiFindAllOperation(Profesional, 'Obtiene todos los profesionales')
  // No se especifica @Roles aquí, por lo que RolesGuard no restringirá por roles para este método.
  // Sin embargo, JwtAuthGuard sigue protegiéndolo.
  async findAll(): Promise<Profesional[]> {
    return this.profesionalesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: CustomRequest) {
    // 👈 Usamos @Request para acceder al usuario inyectado
    // El payload del JWT (ej: { usuarioId: 1, rol: 'profesional', iat: ..., exp: ... })
    // es inyectado en req.user por el JwtAuthGuard.

    console.log('Datos del usuario autenticado:', req.user);

    // DEBE RETORNAR UN OBJETO JSON VÁLIDO
    return {
      // Mapeamos 'sub' a 'usuarioId' para el Frontend
      usuarioId: req.user.sub,

      // Mapeamos 'nombreRol' a 'rol' para el Frontend
      rol: req.user.nombreRol,

      nombreUsuario: req.user.nombreUsuario,
      mensaje: 'Acceso y token válidos.',
    };
  }

  /**
   * Obtiene un profesional específico por su ID.
   * Accesible para todos los usuarios autenticados.
   * @param id El ID (UUID) del profesional a buscar.
   * @returns El profesional encontrado o null.
   */
  @Get(':id')
  @ApiFindOneOperation(Profesional, 'Obtiene un profesional por su ID')
  async findOne(@Param('id') id: string): Promise<Profesional | null> {
    return this.profesionalesService.findOne(id);
  }

  /**
   * Actualiza parcialmente un profesional existente.
   * SOLO ACCESIBLE para roles 'Administrador' o 'Profesional'.
   * @param id El ID del profesional a actualizar.
   * @param updateProfesionalDto El DTO con los datos parciales para actualizar.
   * @returns El objeto Profesional actualizado.
   */
  @Patch(':id')
  @ApiUpdateOperation(Profesional, 'Actualiza un profesional existente')
  @Roles('Administrador', 'Profesional') // <-- Aquí usamos tu decorador!
  async actualiza(
    @Param('id') id: string,
    @Body() updateProfesionalDto: UpdateProfesionalDto,
  ): Promise<Profesional> {
    return await this.profesionalesService.actualiza(id, updateProfesionalDto);
  }
}
