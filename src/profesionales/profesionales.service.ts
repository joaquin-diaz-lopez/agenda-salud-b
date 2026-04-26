// src/profesionales/profesionales.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // Importamos DataSource para transacciones
import { Profesional } from './entities/profesional.entity';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CentroDeSalud } from '../centros-de-salud/entities/centro-de-salud.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { ProfesionalServiciosService } from '../profesional-servicios/profesional-servicios.service';
import { AgendaProfesional } from '../agendas/agendas-profesional/entities/agenda-profesional.entity';

@Injectable()
export class ProfesionalesService {
  private readonly logger = new Logger(ProfesionalesService.name);

  constructor(
    @InjectRepository(Profesional)
    private profesionalesRepository: Repository<Profesional>,
    @InjectRepository(AgendaProfesional)
    private agendaRepository: Repository<AgendaProfesional>,
    private usuariosService: UsuariosService,
    @InjectRepository(CentroDeSalud)
    private centroDeSaludRepository: Repository<CentroDeSalud>,
    @Inject(forwardRef(() => ProfesionalServiciosService))
    private profesionalServiciosService: ProfesionalServiciosService,
    private dataSource: DataSource, // Inyectamos para la transacción
  ) {}

  async create(
    createProfesionalDto: CreateProfesionalDto,
  ): Promise<Profesional> {
    const { idUsuario, email, idCentroDeSalud } = createProfesionalDto;

    // 1. Validaciones previas
    const usuario = await this.usuariosService.buscarPorId(idUsuario);
    if (!usuario)
      throw new NotFoundException(
        `Usuario con ID '${idUsuario}' no encontrado.`,
      );
    if (usuario.profesional)
      throw new ConflictException(
        `El usuario ya está asociado a otro profesional.`,
      );

    const emailExistente = await this.profesionalesRepository.findOne({
      where: { email },
    });
    if (emailExistente)
      throw new ConflictException(`El email '${email}' ya está en uso.`);

    if (idCentroDeSalud) {
      const centro = await this.centroDeSaludRepository.findOne({
        where: { id: idCentroDeSalud },
      });
      if (!centro)
        throw new NotFoundException(`Centro de Salud no encontrado.`);
    }

    // 2. Ejecución en Transacción (Crear Profesional + Agenda)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const nuevoProfesional =
        this.profesionalesRepository.create(createProfesionalDto);
      const profesionalGuardado =
        await queryRunner.manager.save(nuevoProfesional);

      const nuevaAgenda = this.agendaRepository.create({
        idProfesional: profesionalGuardado.id,
        nombre: `Agenda de ${profesionalGuardado.nombre} ${profesionalGuardado.apellido}`,
      });
      await queryRunner.manager.save(nuevaAgenda);

      await queryRunner.commitTransaction();

      // Retornamos con la agenda cargada
      return this.findOne(profesionalGuardado.id) as Promise<Profesional>;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // --- MÉTODO DE REPARACIÓN PARA PROFESIONALES EXISTENTES ---
  async repararAgendasFaltantes(): Promise<{
    procesados: number;
    creadas: number;
  }> {
    const profesionalesSinAgenda = await this.profesionalesRepository
      .createQueryBuilder('profesional')
      .leftJoin('profesional.agenda', 'agenda')
      .where('agenda.id IS NULL')
      .getMany();

    let creadas = 0;
    for (const prof of profesionalesSinAgenda) {
      const nuevaAgenda = this.agendaRepository.create({
        idProfesional: prof.id,
        nombre: `Agenda de ${prof.nombre} ${prof.apellido}`,
      });
      await this.agendaRepository.save(nuevaAgenda);
      creadas++;
    }

    this.logger.log(`Reparación completada. Se crearon ${creadas} agendas.`);
    return { procesados: profesionalesSinAgenda.length, creadas };
  }

  async findAll(): Promise<Profesional[]> {
    return this.profesionalesRepository.find({
      relations: ['usuario', 'centroDeSalud', 'agenda'],
    });
  }

  async findOne(id: string): Promise<Profesional | null> {
    return this.profesionalesRepository.findOne({
      where: { id },
      relations: ['usuario', 'centroDeSalud', 'agenda'], // Añadida 'agenda' aquí también
    });
  }

  async actualiza(
    id: string,
    updateProfesionalDto: UpdateProfesionalDto,
  ): Promise<Profesional> {
    const profesionalToUpdate = await this.findOne(id);
    if (!profesionalToUpdate)
      throw new NotFoundException(`Profesional no encontrado.`);

    if (
      updateProfesionalDto.email &&
      updateProfesionalDto.email !== profesionalToUpdate.email
    ) {
      const emailEnUso = await this.profesionalesRepository.findOne({
        where: { email: updateProfesionalDto.email },
      });
      if (emailEnUso && emailEnUso.id !== id)
        throw new ConflictException(`Email ya en uso.`);
    }

    if (
      updateProfesionalDto.idUsuario &&
      updateProfesionalDto.idUsuario !== profesionalToUpdate.idUsuario
    ) {
      const nuevoUsuario = await this.usuariosService.buscarPorId(
        updateProfesionalDto.idUsuario,
      );
      if (!nuevoUsuario) throw new NotFoundException(`Usuario no encontrado.`);
      if (nuevoUsuario.profesional && nuevoUsuario.profesional.id !== id)
        throw new ConflictException(`Usuario ya asociado.`);

      profesionalToUpdate.idUsuario = nuevoUsuario.id;
      profesionalToUpdate.usuario = nuevoUsuario;
    }

    const { idUsuario: _, ...restOfUpdateDto } = updateProfesionalDto;
    Object.assign(profesionalToUpdate, restOfUpdateDto);

    return this.profesionalesRepository.save(profesionalToUpdate);
  }

  async elimina(id: string): Promise<void> {
    const profesional = await this.findOne(id);
    if (!profesional) throw new NotFoundException(`Profesional no encontrado.`);
    await this.profesionalesRepository.remove(profesional);
  }

  async profesionalOfreceServicio(
    idProfesional: string,
    idServicio: string,
  ): Promise<boolean> {
    const asociacion =
      await this.profesionalServiciosService.findByProfesionalAndServicio(
        idProfesional,
        idServicio,
      );
    return !!asociacion;
  }
}
