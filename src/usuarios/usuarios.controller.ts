// src/usuarios/usuarios.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Usuario } from './entities/usuario.entity';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
} from '../common/decorators/api-operations.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * 🚨 NUEVO ENDPOINT: Obtener usuarios disponibles para ser asociados a un paciente.
   * IMPORTANTE: Debe ir antes de @Get(':id')
   */
  @Get('disponibles-pacientes')
  @ApiOperation({
    summary:
      'Obtiene usuarios con rol PACIENTE sin cuenta de paciente asignada',
  })
  @ApiResponse({ status: 200, type: [Usuario] })
  async findDisponiblesParaPaciente(): Promise<Usuario[]> {
    return this.usuariosService.buscarDisponiblesParaPaciente();
  }

  @Post()
  @ApiCreateOperation(Usuario, 'Crea un nuevo usuario')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    return this.usuariosService.create(createUsuarioDto);
  }

  /**
   * 🚨 NUEVO ENDPOINT: Obtener todos los usuarios.
   * Utiliza el decorador personalizado para la documentación de Swagger.
   */
  @Get()
  @ApiFindAllOperation(Usuario, 'Obtiene la lista de todos los usuarios')
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Usuario[]> {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @ApiFindOneOperation(Usuario, 'Obtiene un usuario por su ID')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Usuario | null> {
    return this.usuariosService.buscarPorId(id);
  }
}
