// src/agendas/slot-disponibilidad.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { SlotDisponibilidad } from './entities/slot-disponibilidad.entity';
import { CreateSlotDisponibilidadDto } from './dto/create-slot-disponibilidad.dto';
import { UpdateSlotDisponibilidadDto } from './dto/update-slot-disponibilidad.dto';
import { JornadaDiariaService } from 'src/agendas/jornadas-diarias/jornada-diaria.service';
import { DescansoService } from 'src/agendas/descansos/descanso.service';

/**
 * Servicio para la gestión de Slots de Disponibilidad.
 * Encargado de generar, consultar y actualizar los slots de tiempo disponibles
 * de un profesional, tomando en cuenta sus jornadas y descansos.
 */
@Injectable()
export class SlotDisponibilidadService {
  constructor(
    @InjectRepository(SlotDisponibilidad)
    private slotDisponibilidadRepository: Repository<SlotDisponibilidad>,
    private jornadaDiariaService: JornadaDiariaService,
    private descansoService: DescansoService,
  ) {}

  // Define  relación estándar para no repetirlas
  private readonly standardRelations = [
    'jornadaDiaria',
    'cita',
    'cita.paciente',
    'descanso',
  ];

  /**
   * Genera slots de disponibilidad para una jornada diaria específica.
   * Este método es central para poblar la agenda de un profesional.
   * @param idJornadaDiaria El ID de la jornada diaria.
   * @param duracionSlotMinutos Duración de cada slot en minutos (ej. 30).
   * @returns Un array de SlotsDisponibilidad generados.
   * @throws NotFoundException Si la jornada diaria no existe.
   * @throws BadRequestException Si la duración del slot no es válida.
   */
  async generateSlots(
    idJornadaDiaria: string,
    duracionSlotMinutos: number,
  ): Promise<SlotDisponibilidad[]> {
    if (duracionSlotMinutos <= 0 || duracionSlotMinutos > 240) {
      // Limitar la duración razonablemente
      throw new BadRequestException(
        'La duración del slot debe ser un número positivo y razonable (ej. entre 1 y 240 minutos).',
      );
    }

    const jornada = await this.jornadaDiariaService.findOne(idJornadaDiaria);
    if (!jornada) throw new NotFoundException('Jornada no encontrada');

    const descansos =
      await this.descansoService.findByJornadaDiariaId(idJornadaDiaria);

    // Normalización de Fecha: Extraer YYYY-MM-DD sin ruido de zona horaria
    const fechaString = new Date(jornada.fecha).toISOString().split('T')[0];

    // Construir fechas de inicio y fin combinando la fecha del día con el string de hora
    const inicioJornada = new Date(
      `${fechaString}T${jornada.horaInicioTrabajo}`,
    );
    const finJornada = new Date(`${fechaString}T${jornada.horaFinTrabajo}`);

    const generatedSlots: SlotDisponibilidad[] = [];
    let currentTime = new Date(inicioJornada);

    while (currentTime < finJornada) {
      const slotEndTime = new Date(
        currentTime.getTime() + duracionSlotMinutos * 60 * 1000,
      );

      if (slotEndTime > finJornada) break;

      const isOverlappingWithBreak = descansos.some((descanso) => {
        const dInicio = new Date(descanso.horaInicio);
        const dFin = new Date(descanso.horaFin);
        return currentTime < dFin && slotEndTime > dInicio;
      });

      if (!isOverlappingWithBreak) {
        generatedSlots.push(
          this.slotDisponibilidadRepository.create({
            idJornadaDiaria: jornada.id,
            horaInicio: new Date(currentTime),
            horaFin: new Date(slotEndTime),
            estaReservado: false,
            estaBloqueado: false,
          }),
        );
      }
      currentTime = new Date(slotEndTime);
    }

    return this.slotDisponibilidadRepository.save(generatedSlots);
  }

  /**
   * Crea un slot de disponibilidad manualmente (generalmente no se usa directamente, sino a través de generateSlots).
   * @param createSlotDisponibilidadDto El DTO para crear el slot.
   * @returns El SlotDisponibilidad creado.
   */
  async create(
    createSlotDisponibilidadDto: CreateSlotDisponibilidadDto,
  ): Promise<SlotDisponibilidad> {
    const { idJornadaDiaria, horaInicio, horaFin } =
      createSlotDisponibilidadDto;

    const jornada = await this.jornadaDiariaService.findOne(idJornadaDiaria);
    if (!jornada) {
      throw new NotFoundException(
        `Jornada Diaria con ID '${idJornadaDiaria}' no encontrada.`,
      );
    }

    const newSlot = this.slotDisponibilidadRepository.create({
      ...createSlotDisponibilidadDto,
      jornadaDiaria: jornada,
      idJornadaDiaria: jornada.id,
      estaReservado: false,
      estaBloqueado: false,
    });
    return this.slotDisponibilidadRepository.save(newSlot);
  }

  /**
   * Busca todos los slots de disponibilidad.
   * Carga la relación 'jornadaDiaria'.
   * @returns Un array de slots de disponibilidad.
   */
  async findAll(): Promise<SlotDisponibilidad[]> {
    return this.slotDisponibilidadRepository.find({
      relations: this.standardRelations,
    });
  }

  /**
   * Busca un slot de disponibilidad por su ID.
   * Carga las relaciones 'jornadaDiaria', 'cita', 'descanso'.
   * @param id El ID del slot a buscar.
   * @returns El SlotDisponibilidad si se encuentra, o null.
   */
  async findOne(id: string): Promise<SlotDisponibilidad | null> {
    return this.slotDisponibilidadRepository.findOne({
      where: { id },
      relations: this.standardRelations,
    });
  }

  // Agregar a SlotDisponibilidadService
  async findByProfesionalAndRange(
    idProfesional: string,
    inicio: Date,
    fin: Date,
  ) {
    return this.slotDisponibilidadRepository.find({
      where: {
        jornadaDiaria: {
          agendaProfesional: { idProfesional },
          fecha: Between(inicio, fin),
        },
      },
      relations: this.standardRelations,
      order: { horaInicio: 'ASC' },
    });
  }

  /**
   * Actualiza parcialmente un slot de disponibilidad existente.
   * @param id El ID del slot a actualizar.
   * @param updateSlotDisponibilidadDto El DTO con los datos parciales para actualizar.
   * @returns El SlotDisponibilidad actualizado.
   * @throws NotFoundException Si el slot no se encuentra.
   * @throws ConflictException Si se intenta reservar un slot ya ocupado.
   */
  async actualiza(
    id: string,
    updateSlotDisponibilidadDto: UpdateSlotDisponibilidadDto,
  ): Promise<SlotDisponibilidad> {
    const slotToUpdate = await this.slotDisponibilidadRepository.findOne({
      where: { id },
      relations: this.standardRelations,
    });

    if (!slotToUpdate) {
      throw new NotFoundException(
        `Slot de Disponibilidad con ID '${id}' no encontrado para actualizar.`,
      );
    }

    // Si se intenta actualizar idJornadaDiaria
    if (
      updateSlotDisponibilidadDto.idJornadaDiaria &&
      updateSlotDisponibilidadDto.idJornadaDiaria !==
        slotToUpdate.idJornadaDiaria
    ) {
      const nuevaJornada = await this.jornadaDiariaService.findOne(
        updateSlotDisponibilidadDto.idJornadaDiaria,
      );
      if (!nuevaJornada) {
        throw new NotFoundException(
          `Nueva Jornada Diaria con ID '${updateSlotDisponibilidadDto.idJornadaDiaria}' no encontrada.`,
        );
      }
      slotToUpdate.jornadaDiaria = nuevaJornada;
      slotToUpdate.idJornadaDiaria = nuevaJornada.id;
    }

    // Lógica para actualizar 'estaReservado'
    if (updateSlotDisponibilidadDto.estaReservado !== undefined) {
      if (
        updateSlotDisponibilidadDto.estaReservado === true &&
        slotToUpdate.estaBloqueado
      ) {
        throw new ConflictException(
          'No se puede reservar un slot que está bloqueado.',
        );
      }
      slotToUpdate.estaReservado = updateSlotDisponibilidadDto.estaReservado;
    }

    // Lógica para actualizar 'estaBloqueado'
    if (updateSlotDisponibilidadDto.estaBloqueado !== undefined) {
      if (
        updateSlotDisponibilidadDto.estaBloqueado === true &&
        slotToUpdate.estaReservado
      ) {
        throw new ConflictException(
          'No se puede bloquear un slot que ya está reservado.',
        );
      }
      slotToUpdate.estaBloqueado = updateSlotDisponibilidadDto.estaBloqueado;
    }

    // Aplicar otras actualizaciones primitivas
    const {
      idJornadaDiaria: _,
      estaReservado: __,
      estaBloqueado: ___,
      ...restOfUpdateDto
    } = updateSlotDisponibilidadDto;
    Object.assign(slotToUpdate, restOfUpdateDto);

    return this.slotDisponibilidadRepository.save(slotToUpdate);
  }

  /**
   * Guarda una instancia de SlotDisponibilidad.
   * Muy útil para manejar la relación bidireccional con Cita (marcar como reservado).
   * @param slot El slot de disponibilidad a guardar.
   * @returns El slot de disponibilidad guardado.
   */
  async save(slot: SlotDisponibilidad): Promise<SlotDisponibilidad> {
    return this.slotDisponibilidadRepository.save(slot);
  }
}
