// src/usuarios/usuarios.controller.ts
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
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto'; // Importamos el nuevo DTO
import { Usuario } from './entities/usuario.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Asegúrate de que la ruta sea correcta
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
   * 🔐 NUEVO ENDPOINT: Cambiar la contraseña del usuario autenticado.
   * Se extrae el ID del usuario del token JWT por seguridad.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('cambiar-contrasena')
  @ApiOperation({
    summary: 'Cambia la contraseña del usuario que ha iniciado sesión',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada con éxito.',
  })
  @ApiResponse({
    status: 401,
    description: 'Contraseña actual incorrecta o no autorizado.',
  })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const usuarioId = req.user.id;

    if (!usuarioId) {
      console.error('Error: No se encontró el ID en req.user', req.user);
      throw new UnauthorizedException('No se pudo identificar al usuario.');
    }

    return this.usuariosService.changePassword(usuarioId, changePasswordDto);
  }

  /**
   * Obtener usuarios disponibles para ser asociados a un paciente.
   * IMPORTANTE: Debe ir antes de @Get(':id') para evitar conflictos de rutas.
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
