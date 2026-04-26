// src/agendas/jornada-diaria.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JornadaDiaria } from './entities/jornada-diaria.entity';
import { CreateJornadaDiariaDto } from './dto/create-jornada-diaria.dto';
import { UpdateJornadaDiariaDto } from './dto/update-jornada-diaria.dto';
import { AgendaProfesionalService } from 'src/agendas/agendas-profesional/agenda-profesional.service';

/**
 * Servicio para la gestión de Jornadas Diarias.
 * Permite definir los horarios de trabajo de un profesional para un día específico.
 */
@Injectable()
export class JornadaDiariaService {
  constructor(
    @InjectRepository(JornadaDiaria)
    private jornadaDiariaRepository: Repository<JornadaDiaria>,
    private agendaProfesionalService: AgendaProfesionalService, // Inyecta AgendaProfesionalService
  ) {}

  /**
   * Crea una nueva jornada diaria para un profesional en una fecha específica.
   * Valida la existencia de la agenda profesional y la unicidad de la jornada por fecha.
   * @param createJornadaDiariaDto El DTO con los datos para crear la jornada.
   * @returns La JornadaDiaria recién creada.
   * @throws NotFoundException Si la agenda profesional no existe.
   * @throws ConflictException Si ya existe una jornada para esa fecha en esa agenda.
   * @throws BadRequestException Si la hora de inicio es posterior o igual a la hora de fin.
   */
  async create(
    createJornadaDiariaDto: CreateJornadaDiariaDto,
  ): Promise<JornadaDiaria> {
    const { idAgendaProfesional, fecha, horaInicioTrabajo, horaFinTrabajo } =
      createJornadaDiariaDto;

    // 1. Validar existencia de la agenda profesional
    const agendaProfesional =
      await this.agendaProfesionalService.findOne(idAgendaProfesional);
    if (!agendaProfesional) {
      throw new NotFoundException(
        `Agenda Profesional con ID '${idAgendaProfesional}' no encontrada.`,
      );
    }

    // 2. Validar que la hora de inicio sea anterior a la hora de fin
    const [hInicio, mInicio] = horaInicioTrabajo.split(':').map(Number);
    const [hFin, mFin] = horaFinTrabajo.split(':').map(Number);
    const inicioTotalMinutos = hInicio * 60 + mInicio;
    const finTotalMinutos = hFin * 60 + mFin;

    if (inicioTotalMinutos >= finTotalMinutos) {
      throw new BadRequestException(
        'La hora de inicio de trabajo debe ser anterior a la hora de fin de trabajo.',
      );
    }

    // 3. Verificar unicidad de la jornada para esa agenda y fecha (la entidad ya lo maneja con @Unique)
    const fechaISO =
      fecha instanceof Date
        ? fecha.toISOString().split('T')[0]
        : new Date(fecha).toISOString().split('T')[0];

    const jornadaExistente = await this.jornadaDiariaRepository.findOne({
      where: {
        idAgendaProfesional,
        fecha: fechaISO as any, // TypeORM puede necesitar ayuda con Date para unique en algunos drivers
      },
    });

    if (jornadaExistente) {
      throw new ConflictException(
        `Ya existe una jornada diaria para la fecha '${fechaISO}' en la agenda '${idAgendaProfesional}'.`,
      );
    }

    // 4. Crear la nueva instancia de la entidad JornadaDiaria
    const nuevaJornada = this.jornadaDiariaRepository.create({
      ...createJornadaDiariaDto,
      agendaProfesional, // Asigna el objeto agenda profesional para la relación
    });

    // 5. Guardar la nueva jornada en la base de datos
    return this.jornadaDiariaRepository.save(nuevaJornada);
  }

  /**
   * Busca todas las jornadas diarias.
   * Carga la relación 'agendaProfesional'.
   * @returns Un array de jornadas diarias.
   */
  async findAll(): Promise<JornadaDiaria[]> {
    return this.jornadaDiariaRepository.find({
      relations: ['agendaProfesional'],
    });
  }

  /**
   * Busca una jornada diaria por su ID e incluye sus slots para saber si está vacía.
   */
  async findOne(id: string): Promise<JornadaDiaria | null> {
    return this.jornadaDiariaRepository.findOne({
      where: { id },
      relations: ['agendaProfesional', 'slotsDisponibilidad'], // <-- Agregamos slotsDisponibilidad
    });
  }

  /**
   * Busca jornadas por Agenda, útil para el calendario.
   */
  async findByAgendaProfesionalId(
    idAgendaProfesional: string,
  ): Promise<JornadaDiaria[]> {
    return this.jornadaDiariaRepository.find({
      where: { idAgendaProfesional },
      relations: ['agendaProfesional', 'slotsDisponibilidad'], // <-- Importante para el UI
    });
  }

  /**
   * Actualiza parcialmente una jornada diaria existente.
   * @param id El ID de la jornada a actualizar.
   * @param updateJornadaDiariaDto El DTO con los datos parciales para actualizar.
   * @returns La JornadaDiaria actualizada.
   * @throws NotFoundException Si la jornada no se encuentra.
   * @throws ConflictException Si se intenta crear una jornada duplicada con una fecha y agenda existente.
   * @throws BadRequestException Si la hora de inicio es posterior o igual a la hora de fin.
   */
  async actualiza(
    id: string,
    updateJornadaDiariaDto: UpdateJornadaDiariaDto,
  ): Promise<JornadaDiaria> {
    const jornadaToUpdate = await this.jornadaDiariaRepository.findOne({
      where: { id },
      relations: ['agendaProfesional'],
    });

    if (!jornadaToUpdate) {
      throw new NotFoundException(
        `Jornada Diaria con ID '${id}' no encontrada para actualizar.`,
      );
    }

    // Validaciones de tiempo si se actualizan las horas
    const horaInicioTrabajo =
      updateJornadaDiariaDto.horaInicioTrabajo ||
      jornadaToUpdate.horaInicioTrabajo;
    const horaFinTrabajo =
      updateJornadaDiariaDto.horaFinTrabajo || jornadaToUpdate.horaFinTrabajo;

    const [hInicio, mInicio] = horaInicioTrabajo.split(':').map(Number);
    const [hFin, mFin] = horaFinTrabajo.split(':').map(Number);
    const inicioTotalMinutos = hInicio * 60 + mInicio;
    const finTotalMinutos = hFin * 60 + mFin;

    if (inicioTotalMinutos >= finTotalMinutos) {
      throw new BadRequestException(
        'La hora de inicio de trabajo debe ser anterior a la hora de fin de trabajo.',
      );
    }

    // Si se actualiza idAgendaProfesional o fecha, verificar unicidad
    if (
      (updateJornadaDiariaDto.idAgendaProfesional &&
        updateJornadaDiariaDto.idAgendaProfesional !==
          jornadaToUpdate.idAgendaProfesional) ||
      (updateJornadaDiariaDto.fecha &&
        updateJornadaDiariaDto.fecha !== jornadaToUpdate.fecha)
    ) {
      const newIdAgenda =
        updateJornadaDiariaDto.idAgendaProfesional ||
        jornadaToUpdate.idAgendaProfesional;
      const newFecha = updateJornadaDiariaDto.fecha || jornadaToUpdate.fecha;
      const fechaISO =
        newFecha instanceof Date
          ? newFecha.toISOString().split('T')[0]
          : new Date(newFecha).toISOString().split('T')[0];

      const existingJornada = await this.jornadaDiariaRepository.findOne({
        where: {
          idAgendaProfesional: newIdAgenda,
          fecha: fechaISO as any,
        },
      });

      // Si existe una jornada con la nueva combinación y no es la jornada actual que estamos actualizando
      if (existingJornada && existingJornada.id !== id) {
        throw new ConflictException(
          `Ya existe una jornada para la fecha '${fechaISO}' en la agenda '${newIdAgenda}'.`,
        );
      }

      // Si se cambió la agenda, validar la existencia de la nueva agenda
      if (
        updateJornadaDiariaDto.idAgendaProfesional &&
        updateJornadaDiariaDto.idAgendaProfesional !==
          jornadaToUpdate.idAgendaProfesional
      ) {
        const nuevaAgenda = await this.agendaProfesionalService.findOne(
          updateJornadaDiariaDto.idAgendaProfesional,
        );
        if (!nuevaAgenda) {
          throw new NotFoundException(
            `Nueva Agenda Profesional con ID '${updateJornadaDiariaDto.idAgendaProfesional}' no encontrada.`,
          );
        }
        jornadaToUpdate.agendaProfesional = nuevaAgenda;
        jornadaToUpdate.idAgendaProfesional = nuevaAgenda.id;
      }
    }

    // Aplicar otras actualizaciones primitivas (excluyendo idAgendaProfesional y fecha si se manejan arriba)
    const {
      idAgendaProfesional: _,
      fecha: __,
      ...restOfUpdateDto
    } = updateJornadaDiariaDto;
    Object.assign(jornadaToUpdate, restOfUpdateDto);

    return this.jornadaDiariaRepository.save(jornadaToUpdate);
  }

  /**
   * Guarda una instancia de JornadaDiaria.
   * Util para manejar relaciones bidireccionales en otros servicios.
   * @param jornada La entidad JornadaDiaria a guardar.
   * @returns La entidad JornadaDiaria guardada.
   */
  async save(jornada: JornadaDiaria): Promise<JornadaDiaria> {
    return this.jornadaDiariaRepository.save(jornada);
  }
}
