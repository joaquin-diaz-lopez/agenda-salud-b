// src/usuarios/entities/usuario.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Rol } from '../../roles/entities/rol.entity';
import { Profesional } from '../../profesionales/entities/profesional.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('usuarios')
export class Usuario {
  @ApiProperty({ description: 'Identificador único del usuario (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre de usuario, debe ser único' })
  @Column({
    unique: true,
    nullable: false,
    length: 100,
    name: 'nombre_usuario',
  })
  nombreUsuario: string; // nombre_usuario

  @ApiProperty({
    description: 'Contraseña del usuario (almacenada como un hash)',
  })
  @Column({ nullable: false, select: false })
  contrasena: string;

  @ApiProperty({ description: 'ID del rol asociado al usuario' })
  @Column({ name: 'id_rol', type: 'uuid', nullable: false })
  idRol: string;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, {
    eager: true,
    nullable: false,
    onDelete: 'RESTRICT', // No se borra el rol si tiene usuarios asociados
  })
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @OneToOne(() => Profesional, (profesional) => profesional.usuario, {
    nullable: true,
  })
  @Exclude({ toPlainOnly: true })
  profesional: Profesional | null;

  @OneToOne(() => Paciente, (paciente) => paciente.usuario, { nullable: true })
  @Exclude({ toPlainOnly: true })
  paciente: Paciente | null;
}
