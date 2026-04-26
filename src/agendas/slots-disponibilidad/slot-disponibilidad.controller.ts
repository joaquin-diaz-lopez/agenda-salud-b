import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'; // <-- Importaciones de Swagger
import { SlotDisponibilidadService } from './slot-disponibilidad.service';
import { CreateSlotDisponibilidadDto } from './dto/create-slot-disponibilidad.dto';
import { UpdateSlotDisponibilidadDto } from './dto/update-slot-disponibilidad.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { SlotDisponibilidad } from './entities/slot-disponibilidad.entity';
import {
  // <-- Importaciones de decoradores personalizados
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
} from '../../common/decorators/api-operations.decorator';

/**
 * Controlador para la gestión de Slots de Disponibilidad.
 * Expone los endpoints HTTP para generar, consultar y actualizar los slots de tiempo disponibles.
 */
@Controller('slots-disponibilidad') // Ruta base: /slots-disponibilidad
@ApiTags('Slots de Disponibilidad') // <-- Etiqueta para agrupar en Swagger
export class SlotDisponibilidadController {
  constructor(
    private readonly slotDisponibilidadService: SlotDisponibilidadService,
  ) {}

  /**
   * Genera múltiples slots de disponibilidad para una jornada diaria específica.
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Genera múltiples slots de disponibilidad para una jornada',
  }) // <-- Uso Op. Estándar
  @ApiBody({
    type: GenerateSlotsDto,
    description: 'Datos para la generación automática de slots.',
  })
  @ApiCreatedResponse({
    description: 'Los slots han sido generados exitosamente.',
    type: SlotDisponibilidad,
    isArray: true,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Jornada diaria no encontrada.',
  })
  async generateSlots(
    @Body() generateSlotsDto: GenerateSlotsDto,
  ): Promise<SlotDisponibilidad[]> {
    const { idJornadaDiaria, duracionSlotMinutos } = generateSlotsDto;
    return this.slotDisponibilidadService.generateSlots(
      idJornadaDiaria,
      duracionSlotMinutos,
    );
  }

  /**
   * Crea un único slot de disponibilidad (uso menos común, se prefiere 'generate').
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(
    SlotDisponibilidad,
    'Crea un único slot de disponibilidad',
  ) // <-- Decorador personalizado
  @ApiBody({
    type: CreateSlotDisponibilidadDto,
    description:
      'Datos para crear un nuevo slot de disponibilidad de forma manual.',
  })
  async create(
    @Body() createSlotDisponibilidadDto: CreateSlotDisponibilidadDto,
  ): Promise<SlotDisponibilidad> {
    return this.slotDisponibilidadService.create(createSlotDisponibilidadDto);
  }

  /**
   * Obtiene todos los slots de disponibilidad.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllOperation(
    SlotDisponibilidad,
    'Obtiene todos los slots de disponibilidad',
  ) // <-- Decorador personalizado
  async findAll(): Promise<SlotDisponibilidad[]> {
    return this.slotDisponibilidadService.findAll();
  }

  /**
   * Obtiene un slot de disponibilidad específico por su ID.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneOperation(
    SlotDisponibilidad,
    'Obtiene un slot de disponibilidad por su ID',
  ) // <-- Decorador personalizado
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del slot a buscar.',
    example: 'e1d2c3b4-a5f6-7890-1234-567890fedcba',
  })
  async findOne(@Param('id') id: string): Promise<SlotDisponibilidad | null> {
    return this.slotDisponibilidadService.findOne(id);
  }

  /**
   * Actualiza parcialmente un slot de disponibilidad existente.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOperation(
    SlotDisponibilidad,
    'Actualiza parcialmente un slot de disponibilidad por su ID',
  ) // <-- Decorador personalizado
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) del slot a actualizar.',
    example: 'e1d2c3b4-a5f6-7890-1234-567890fedcba',
  })
  @ApiBody({
    type: UpdateSlotDisponibilidadDto,
    description:
      'Datos parciales para actualizar el slot (hora, estado de reservado/bloqueado).',
  })
  async actualiza(
    @Param('id') id: string,
    @Body() updateSlotDisponibilidadDto: UpdateSlotDisponibilidadDto,
  ): Promise<SlotDisponibilidad> {
    return await this.slotDisponibilidadService.actualiza(
      id,
      updateSlotDisponibilidadDto,
    );
  }

  @Get('profesional/:idProfesional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtiene slots filtrados por profesional y rango' })
  @ApiParam({ name: 'idProfesional', description: 'ID del profesional' })
  async findByProfesional(
    @Param('idProfesional') idProfesional: string,
    @Query('inicio') inicio?: string,
    @Query('fin') fin?: string,
  ) {
    // Si no vienen fechas, podemos definir un rango por defecto (ej. hoy +/- 30 días)
    // o manejarlo directamente en el servicio.
    const start = inicio ? new Date(inicio) : new Date();
    const end = fin ? new Date(fin) : new Date();

    // Si no se envió fin, le damos un margen de un mes
    if (!fin) end.setMonth(end.getMonth() + 1);

    return this.slotDisponibilidadService.findByProfesionalAndRange(
      idProfesional,
      start,
      end,
    );
  }
}
