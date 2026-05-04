// src/profesionales/entities/profesional.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { CentroDeSalud } from '../../centros-de-salud/entities/centro-de-salud.entity';
import { AgendaProfesional } from '../../agendas/agendas-profesional/entities/agenda-profesional.entity'; // Se definirá
import { Cita } from '../../citas/entities/cita.entity'; // Se definirá
import { ProfesionalServicio } from 'src/profesional-servicios/entities/profesional-servicio.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('profesionales')
export class Profesional {
  @ApiProperty({ description: 'Identificador único del profesional (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Identificador único del usuario asociado' })
  @Column({ name: 'id_usuario', type: 'uuid', unique: true, nullable: false })
  idUsuario: string;

  @OneToOne(() => Usuario, (usuario) => usuario.profesional, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE', // Si se borra el usuario, se borra el profesional
  })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ApiProperty({ description: 'Nombre del profesional' })
  @Column({ nullable: false, length: 100, name: 'nombre' })
  nombre: string;

  @ApiProperty({ description: 'Apellido del profesional' })
  @Column({ nullable: false, length: 100, name: 'apellido' })
  apellido: string;

  @ApiProperty({
    description: 'Dirección de correo electrónico del profesional',
  })
  @Column({ unique: true, nullable: true, length: 150 })
  email: string;

  @ApiProperty({
    description: 'Número de teléfono del profesional',
    required: false,
  })
  @Column({ nullable: true, length: 20 })
  telefono: string;

  @ApiProperty({ description: 'Especialidad del profesional', required: false })
  @Column({ nullable: true, length: 100 })
  especialidad: string;

  @ApiProperty({
    description: 'Identificador único del centro de salud',
    required: false,
  })
  @Column({ name: 'id_centro_salud', type: 'uuid', nullable: true })
  idCentroDeSalud: string;

  @ApiProperty({
    description: 'Hora de inicio de jornada base',
    example: '08:00',
  })
  @Column({
    name: 'hora_inicio_base',
    type: 'varchar',
    length: 5,
    default: '08:00',
  })
  horaInicioBase: string;

  @ApiProperty({ description: 'Hora de fin de jornada base', example: '16:00' })
  @Column({
    name: 'hora_fin_base',
    type: 'varchar',
    length: 5,
    default: '16:00',
  })
  horaFinBase: string;

  @ManyToOne(() => CentroDeSalud, (centro) => centro.profesionales, {
    nullable: true,
    onDelete: 'SET NULL', // Si se borra el centro, el profesional puede existir sin centro
  })
  @JoinColumn({ name: 'id_centro_salud' })
  centroDeSalud: CentroDeSalud;

  @OneToOne(() => AgendaProfesional, (agenda) => agenda.profesional)
  agenda: AgendaProfesional;

  @OneToMany(
    () => ProfesionalServicio,
    (profesionalServicio) => profesionalServicio.profesional,
  )
  profesionalServicios: ProfesionalServicio[]; // Los servicios específicos que este profesional ofrece

  @OneToMany(() => Cita, (cita) => cita.profesional)
  citas: Cita[];
}
