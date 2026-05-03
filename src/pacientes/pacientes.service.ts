// src/pacientes/pacientes.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private pacientesRepository: Repository<Paciente>,
    private usuariosService: UsuariosService,
  ) {}

  /**
   * Crea un nuevo paciente.
   */
  async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
    if (createPacienteDto.email) {
      const emailExistente = await this.pacientesRepository.findOne({
        where: { email: createPacienteDto.email },
      });
      if (emailExistente) {
        throw new ConflictException(
          `El email '${createPacienteDto.email}' ya está en uso por otro paciente.`,
        );
      }
    }

    let usuarioAsociado: Usuario | null = null;
    if (createPacienteDto.idUsuario) {
      usuarioAsociado = await this.usuariosService.buscarPorId(
        createPacienteDto.idUsuario,
      );
      if (!usuarioAsociado) {
        throw new NotFoundException(
          `Usuario con ID '${createPacienteDto.idUsuario}' no encontrado.`,
        );
      }
      if (usuarioAsociado.paciente) {
        throw new ConflictException(
          `El usuario con ID '${createPacienteDto.idUsuario}' ya está asociado a otro paciente.`,
        );
      }
    }

    const nuevoPaciente = this.pacientesRepository.create({
      ...createPacienteDto,
      usuario: usuarioAsociado,
      idUsuario: usuarioAsociado ? usuarioAsociado.id : null,
    });

    return this.pacientesRepository.save(nuevoPaciente);
  }

  /**
   * Busca pacientes.
   * Si se provee profesionalId, solo devuelve pacientes que han tenido citas con él.
   */
  async findAll(profesionalId?: string): Promise<Paciente[]> {
    // Si no hay profesionalId (ej. es un Admin), devolvemos todos
    if (!profesionalId) {
      return this.pacientesRepository.find({ relations: ['usuario'] });
    }

    // Si hay profesionalId, filtramos mediante las citas
    // Nota: Asumimos que la entidad Paciente tiene una relación 'citas'
    return this.pacientesRepository
      .createQueryBuilder('paciente')
      .leftJoinAndSelect('paciente.usuario', 'usuario')
      .innerJoin('paciente.citas', 'cita') // Solo pacientes con citas
      .where('cita.idProfesional = :profesionalId', { profesionalId })
      .getMany();
  }

  async findOne(id: string): Promise<Paciente | null> {
    return this.pacientesRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });
  }

  async actualiza(
    id: string,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    const pacienteToUpdate = await this.pacientesRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!pacienteToUpdate) {
      throw new NotFoundException(`Paciente con ID '${id}' no encontrado.`);
    }

    if (
      updatePacienteDto.email &&
      updatePacienteDto.email !== pacienteToUpdate.email
    ) {
      const emailEnUso = await this.pacientesRepository.findOne({
        where: { email: updatePacienteDto.email },
      });
      if (emailEnUso && emailEnUso.id !== id) {
        throw new ConflictException(
          `El email '${updatePacienteDto.email}' ya está en uso.`,
        );
      }
    }

    // Lógica de actualización de usuario
    if (
      updatePacienteDto.idUsuario !== undefined &&
      updatePacienteDto.idUsuario !== pacienteToUpdate.idUsuario
    ) {
      if (updatePacienteDto.idUsuario === null) {
        if (pacienteToUpdate.usuario) {
          pacienteToUpdate.usuario.paciente = null;
          await this.usuariosService.saveUsuario(pacienteToUpdate.usuario);
        }
        pacienteToUpdate.idUsuario = null;
        pacienteToUpdate.usuario = null;
      } else {
        const nuevoUsuario = await this.usuariosService.buscarPorId(
          updatePacienteDto.idUsuario,
        );
        if (!nuevoUsuario)
          throw new NotFoundException('Usuario no encontrado.');

        if (nuevoUsuario.paciente && nuevoUsuario.paciente.id !== id) {
          throw new ConflictException('Usuario ya asociado a otro paciente.');
        }

        if (
          pacienteToUpdate.usuario &&
          pacienteToUpdate.usuario.id !== nuevoUsuario.id
        ) {
          pacienteToUpdate.usuario.paciente = null;
          await this.usuariosService.saveUsuario(pacienteToUpdate.usuario);
        }

        pacienteToUpdate.idUsuario = nuevoUsuario.id;
        pacienteToUpdate.usuario = nuevoUsuario;
        nuevoUsuario.paciente = pacienteToUpdate;
        await this.usuariosService.saveUsuario(nuevoUsuario);
      }
    }

    const { idUsuario: _, ...restOfUpdateDto } = updatePacienteDto;
    Object.assign(pacienteToUpdate, restOfUpdateDto);

    return this.pacientesRepository.save(pacienteToUpdate);
  }
}
