// src/profesionales/profesionales.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profesional } from './entities/profesional.entity';
import { CreateProfesionalDto } from './dto/create-profesional.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CentroDeSalud } from '../centros-de-salud/entities/centro-de-salud.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UpdateProfesionalDto } from './dto/update-profesional.dto';
import { ProfesionalServiciosService } from '../profesional-servicios/profesional-servicios.service'; // ¡NUEVO!

@Injectable()
export class ProfesionalesService {
  constructor(
    @InjectRepository(Profesional)
    private profesionalesRepository: Repository<Profesional>,
    private usuariosService: UsuariosService,
    @InjectRepository(CentroDeSalud)
    private centroDeSaludRepository: Repository<CentroDeSalud>,
    @Inject(forwardRef(() => ProfesionalServiciosService))
    private profesionalServiciosService: ProfesionalServiciosService,
  ) {}

  async create(
    createProfesionalDto: CreateProfesionalDto,
  ): Promise<Profesional> {
    // Desestructuración con tipos explícitos para mayor seguridad y claridad para ESLint
    const {
      idUsuario,
      email,
      nombre,
      apellido,
      especialidad,
      telefono,
      idCentroDeSalud,
    } = createProfesionalDto;

    // 1. Verificar si el usuario asociado existe y no está ya asociado a un profesional
    const usuario: Usuario | null =
      await this.usuariosService.buscarPorId(idUsuario);

    if (!usuario) {
      throw new NotFoundException(
        `Usuario con ID '${idUsuario}' no encontrado.`,
      );
    }

    // AHORA `usuario.profesional` es de tipo `Profesional | null` gracias a la corrección en Usuario.entity.ts
    if (usuario.profesional) {
      throw new ConflictException(
        `El usuario con ID '${idUsuario}' ya está asociado a otro profesional.`,
      );
    }

    // 2. Verificar si el email ya está en uso por otro profesional
    const emailExistente = await this.profesionalesRepository.findOne({
      where: { email },
    });
    if (emailExistente) {
      throw new ConflictException(
        `El email '${email}' ya está en uso por otro profesional.`,
      );
    }

    // 3. Si se provee idCentroDeSalud, verificar si el centro de salud existe
    if (idCentroDeSalud) {
      const centroDeSalud = await this.centroDeSaludRepository.findOne({
        where: { id: idCentroDeSalud },
      });
      if (!centroDeSalud) {
        throw new NotFoundException(
          `Centro de Salud con ID '${idCentroDeSalud}' no encontrado.`,
        );
      }
    }

    // 4. Crear una nueva instancia de la entidad Profesional
    const nuevoProfesional =
      this.profesionalesRepository.create(createProfesionalDto);

    // 5. Guardar el nuevo profesional en la base de datos
    return this.profesionalesRepository.save(nuevoProfesional);
  }

  async findAll(): Promise<Profesional[]> {
    return this.profesionalesRepository.find({
      relations: ['usuario', 'centroDeSalud'],
    });
  }

  async findOne(id: string): Promise<Profesional | null> {
    return this.profesionalesRepository.findOne({
      where: { id },
      relations: ['usuario', 'centroDeSalud'],
    });
  }

  /**
   * Actualiza parcialmente un profesional existente utilizando el método save().
   * Realiza validaciones para asegurar la existencia del profesional y evitar conflictos de email.
   * @param id El ID del profesional a actualizar.
   * @param updateProfesionalDto El DTO con los datos parciales para actualizar.
   * @returns El objeto Profesional actualizado.
   * @throws NotFoundException Si el profesional no se encuentra.
   * @throws ConflictException Si el email (si se actualiza) ya está en uso por otro profesional.
   */
  async actualiza(
    id: string,
    updateProfesionalDto: UpdateProfesionalDto,
  ): Promise<Profesional> {
    const profesionalToUpdate = await this.profesionalesRepository.findOne({
      where: { id },
      relations: ['usuario', 'centroDeSalud'],
    });

    if (!profesionalToUpdate) {
      throw new NotFoundException(
        `Profesional con ID '${id}' no encontrado para actualizar.`,
      );
    }

    // Si se intenta actualizar el email, verificar que no esté ya en uso por otro profesional
    // Verifica si el email está presente en el DTO de actualización Y es diferente al actual del profesional
    if (
      updateProfesionalDto.email &&
      updateProfesionalDto.email !== profesionalToUpdate.email
    ) {
      const emailEnUso = await this.profesionalesRepository.findOne({
        where: { email: updateProfesionalDto.email },
      });
      // Si se encuentra un profesional con ese email Y su ID es diferente al que estamos actualizando
      if (emailEnUso && emailEnUso.id !== id) {
        throw new ConflictException(
          `El email '${updateProfesionalDto.email}' ya está en uso por otro profesional.`,
        );
      }
    }

    // Si se proporciona un nuevo idUsuario para la actualización
    if (
      updateProfesionalDto.idUsuario &&
      updateProfesionalDto.idUsuario !== profesionalToUpdate.idUsuario
    ) {
      // Busca el nuevo usuario por su ID para asegurar su existencia y crear la relación
      const nuevoUsuario = await this.usuariosService.buscarPorId(
        updateProfesionalDto.idUsuario,
      );
      if (!nuevoUsuario) {
        throw new NotFoundException(
          `Usuario con ID '${updateProfesionalDto.idUsuario}' no encontrado.`,
        );
      }
      // Verifica si el usuario ya está asociado a otro profesional (que no sea el actual que estamos modificando)
      if (nuevoUsuario.profesional && nuevoUsuario.profesional.id !== id) {
        throw new ConflictException(
          `El usuario con ID '${updateProfesionalDto.idUsuario}' ya está asociado a otro profesional.`,
        );
      }

      // Actualiza tanto la clave foránea (idUsuario) como la relación del objeto (usuario)
      profesionalToUpdate.idUsuario = nuevoUsuario.id;
      profesionalToUpdate.usuario = nuevoUsuario; // <-- Aquí TypeORM detecta el cambio de relación
    }

    // Aplica las actualizaciones parciales a las propiedades primitivas de la entidad cargada.
    // Usa Object.assign, excluyendo `idUsuario` ya que lo maneja explícitamente arriba.
    const { idUsuario: _, ...restOfUpdateDto } = updateProfesionalDto; // Desestructura para excluir idUsuario
    Object.assign(profesionalToUpdate, restOfUpdateDto);

    // TypeORM detecta los cambios y solo actualiza las columnas modificadas.
    return this.profesionalesRepository.save(profesionalToUpdate);
  }

  /**
   * Elimina un profesional de la base de datos.
   * @param id El ID del profesional a eliminar.
   * @throws NotFoundException Si el profesional no existe.
   */
  async elimina(id: string): Promise<void> {
    const profesional = await this.findOne(id);

    if (!profesional) {
      throw new NotFoundException(
        `Profesional con ID '${id}' no encontrado para eliminar.`,
      );
    }

    // Nota: Gracias a la integridad referencial de SQL,
    // si tienes configurado onDelete: 'CASCADE' en la tabla intermedia,
    // se borrarán sus servicios automáticamente. Si no, TypeORM fallará
    // protegiendo los datos.
    await this.profesionalesRepository.remove(profesional);
  }

  /**
   * Verifica si un profesional específico ofrece un servicio particular.
   * @param idProfesional El ID del profesional.
   * @param idServicio El ID del servicio.
   * @returns true si el profesional ofrece el servicio, false en caso contrario.
   */
  async profesionalOfreceServicio(
    idProfesional: string,
    idServicio: string,
  ): Promise<boolean> {
    // Asume que ProfesionalServiciosService tiene un método para buscar por ambos IDs
    const asociacion =
      await this.profesionalServiciosService.findByProfesionalAndServicio(
        idProfesional,
        idServicio,
      ); // ¡Asume este método!
    return !!asociacion; // Devuelve true si la asociación existe, false si es null/undefined
  }
}
