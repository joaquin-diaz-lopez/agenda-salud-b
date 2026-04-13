// src/profesional-servicios/profesional-servicios.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfesionalServicio } from './entities/profesional-servicio.entity';
import { CreateProfesionalServicioDto } from './dto/create-profesional-servicio.dto';
import { ProfesionalesService } from '../profesionales/profesionales.service';
import { ServiciosService } from '../servicios/servicios.service';

@Injectable()
export class ProfesionalServiciosService {
  constructor(
    @InjectRepository(ProfesionalServicio)
    private profesionalServiciosRepository: Repository<ProfesionalServicio>,
    private serviciosService: ServiciosService,
    @Inject(forwardRef(() => ProfesionalesService))
    private profesionalesService: ProfesionalesService,
  ) {}

  async create(
    dto: CreateProfesionalServicioDto,
  ): Promise<ProfesionalServicio> {
    const { idProfesional, idServicio } = dto;

    const profesional = await this.profesionalesService.findOne(idProfesional);
    if (!profesional) throw new NotFoundException('Profesional no encontrado');

    const servicio = await this.serviciosService.findOne(idServicio);
    if (!servicio) throw new NotFoundException('Servicio no encontrado');

    const existe = await this.profesionalServiciosRepository.findOne({
      where: { idProfesional, idServicio },
    });
    if (existe) throw new ConflictException('La asociación ya existe');

    const nuevaAsociacion = this.profesionalServiciosRepository.create(dto);
    return this.profesionalServiciosRepository.save(nuevaAsociacion);
  }

  async findAll(): Promise<ProfesionalServicio[]> {
    return this.profesionalServiciosRepository.find({
      relations: ['profesional', 'servicio'],
    });
  }

  // --- NUEVO: Lógica para buscar por Profesional ---
  async findByProfesional(
    idProfesional: string,
  ): Promise<ProfesionalServicio[]> {
    return this.profesionalServiciosRepository.find({
      where: { idProfesional },
      relations: ['servicio'], // Traemos el detalle del servicio para el Frontend
    });
  }

  // --- NUEVO: Lógica para eliminar ---
  async remove(id: string): Promise<void> {
    const resultado = await this.profesionalServiciosRepository.delete(id);
    if (resultado.affected === 0) {
      throw new NotFoundException(`Asociación con ID ${id} no encontrada`);
    }
  }

  // Mantenemos este para validaciones internas de otros servicios
  async findByProfesionalAndServicio(
    idProfesional: string,
    idServicio: string,
  ) {
    return this.profesionalServiciosRepository.findOne({
      where: { idProfesional, idServicio },
    });
  }
}
