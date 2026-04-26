// src/profesionales/profesionales.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfesionalesService } from './profesionales.service';
import { ProfesionalesController } from './profesionales.controller';
import { Profesional } from './entities/profesional.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CentroDeSalud } from '../centros-de-salud/entities/centro-de-salud.entity';
// Importamos la entidad de Agenda
import { AgendaProfesional } from '../agendas/agendas-profesional/entities/agenda-profesional.entity';
import { ProfesionalServiciosModule } from 'src/profesional-servicios/profesional-servicios.module';
import { CentrosDeSaludModule } from '../centros-de-salud/centros-de-salud.module';

@Module({
  imports: [
    // Agregamos AgendaProfesional al forFeature
    TypeOrmModule.forFeature([Profesional, CentroDeSalud, AgendaProfesional]),
    UsuariosModule,
    CentrosDeSaludModule,
    forwardRef(() => ProfesionalServiciosModule),
  ],
  providers: [ProfesionalesService],
  controllers: [ProfesionalesController],
  exports: [ProfesionalesService],
})
export class ProfesionalesModule {}
