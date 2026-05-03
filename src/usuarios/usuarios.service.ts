// src/usuarios/usuarios.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto'; // Importamos el nuevo DTO
import * as bcrypt from 'bcrypt';
import { Rol } from '../roles/entities/rol.entity';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolesRepository: Repository<Rol>,
  ) {}

  /**
   * Busca un usuario por su nombre de usuario.
   */
  async buscarPorNombreUsuario(nombreUsuario: string): Promise<Usuario | null> {
    const usuario = await this.usuariosRepository.findOne({
      where: { nombreUsuario },
      relations: ['rol'],
    });
    return usuario;
  }

  /**
   * Busca un usuario por su ID.
   */
  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: { id },
      relations: ['rol', 'profesional'],
    });
  }

  /**
   * Crea un nuevo usuario hasheando su contraseña.
   */
  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    const usuarioExistente = await this.usuariosRepository.findOne({
      where: { nombreUsuario: createUsuarioDto.nombreUsuario },
    });
    if (usuarioExistente) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    const rol = await this.rolesRepository.findOne({
      where: { id: createUsuarioDto.idRol },
    });
    if (!rol) {
      throw new NotFoundException(
        `El Rol con ID ${createUsuarioDto.idRol} no fue encontrado.`,
      );
    }

    const contrasenaHasheada = await bcrypt.hash(
      createUsuarioDto.contrasena,
      10,
    );

    const nuevoUsuario = this.usuariosRepository.create({
      nombreUsuario: createUsuarioDto.nombreUsuario,
      contrasena: contrasenaHasheada,
      rol: rol,
      idRol: rol.id,
    });

    return this.usuariosRepository.save(nuevoUsuario);
  }

  /**
   * Busca usuarios con rol PACIENTE sin registro de paciente asociado.
   */
  async buscarDisponiblesParaPaciente(): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      where: {
        rol: { nombre: 'PACIENTE' },
        paciente: { id: IsNull() },
      },
      relations: ['rol'],
    });
  }

  /**
   * Guarda una instancia de Usuario.
   */
  async saveUsuario(usuario: Usuario): Promise<Usuario> {
    return this.usuariosRepository.save(usuario);
  }

  /**
   * Obtiene todos los usuarios.
   */
  async findAll(): Promise<Usuario[]> {
    return this.usuariosRepository.find({
      relations: ['rol'],
    });
  }

  /**
   * Método para Auth: obtiene el usuario incluyendo la contraseña oculta.
   */
  async findByUsernameForAuth(nombreUsuario: string): Promise<Usuario | null> {
    return this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.contrasena')
      .where('usuario.nombreUsuario = :nombreUsuario', { nombreUsuario })
      .getOne();
  }

  /**
   * 🔐 NUEVO MÉTODO: Cambia la contraseña validando la anterior.
   * @param id ID del usuario (obtenido del JWT).
   * @param dto Datos con la contraseña actual y la nueva.
   */
  async changePassword(
    id: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // 1. Buscamos el usuario incluyendo la contraseña oculta
    const usuario = await this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.contrasena')
      .where('usuario.id = :id', { id }) // Asegura que coincida con el UUID
      .getOne();

    if (!usuario) {
      // Si llegamos aquí, el ID que mandó el controller no existe en la BD
      console.error(`ID buscado no encontrado en BD: ${id}`);
      throw new NotFoundException('Usuario no encontrado en el sistema.');
    }

    // 2. Comparar contraseña actual
    const isMatch = await bcrypt.compare(
      dto.contrasenaActual,
      usuario.contrasena,
    );

    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    // 3. Hashear y guardar nueva contraseña
    usuario.contrasena = await bcrypt.hash(dto.nuevaContrasena, 10);
    await this.usuariosRepository.save(usuario);

    return { message: 'Tu contraseña ha sido actualizada con éxito.' };
  }

  /**
   * Actualiza parcialmente un usuario.
   */
  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    if (updateUsuarioDto.contrasena) {
      updateUsuarioDto.contrasena = await bcrypt.hash(
        updateUsuarioDto.contrasena,
        10,
      );
    }

    let rol: Rol | null | undefined = undefined;
    if (updateUsuarioDto.idRol) {
      rol = await this.rolesRepository.findOne({
        where: { id: updateUsuarioDto.idRol },
      });
      if (rol === null) {
        throw new NotFoundException(
          `El Rol con ID ${updateUsuarioDto.idRol} no fue encontrado.`,
        );
      }
    }

    const usuarioActualizado = this.usuariosRepository.merge(usuario, {
      ...updateUsuarioDto,
      rol: rol,
      idRol: updateUsuarioDto.idRol,
    });

    return this.usuariosRepository.save(usuarioActualizado);
  }

  /**
   * Elimina un usuario por su ID.
   */
  async remove(id: string): Promise<void> {
    const result = await this.usuariosRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
  }
}
