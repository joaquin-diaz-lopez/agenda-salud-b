// src/agendas/jornadas-diarias/jornada-diaria.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JornadaDiariaService } from './jornada-diaria.service';
import { CreateJornadaDiariaDto } from './dto/create-jornada-diaria.dto';
import { UpdateJornadaDiariaDto } from './dto/update-jornada-diaria.dto';
import { JornadaDiaria } from './entities/jornada-diaria.entity';
import {
  ApiCreateOperation,
  ApiFindAllOperation,
  ApiFindOneOperation,
  ApiUpdateOperation,
  ApiFindAllByParamOperation,
} from '../../common/decorators/api-operations.decorator';

@Controller('jornadas-diarias')
@ApiTags('Jornadas Diarias')
export class JornadaDiariaController {
  constructor(private readonly jornadaDiariaService: JornadaDiariaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateOperation(
    JornadaDiaria,
    'Crea una nueva jornada diaria para una agenda',
  )
  @ApiBody({ type: CreateJornadaDiariaDto })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Ya existe una jornada diaria para esta agenda en la fecha especificada.',
  })
  async create(
    @Body() createJornadaDiariaDto: CreateJornadaDiariaDto,
  ): Promise<JornadaDiaria> {
    return this.jornadaDiariaService.create(createJornadaDiariaDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllOperation(
    JornadaDiaria,
    'Obtiene todas las jornadas diarias registradas',
  )
  async findAll(): Promise<JornadaDiaria[]> {
    return this.jornadaDiariaService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneOperation(JornadaDiaria, 'Obtiene una jornada diaria por su ID')
  @ApiParam({ name: 'id', description: 'ID (UUID) de la Jornada Diaria.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JornadaDiaria | null> {
    return this.jornadaDiariaService.findOne(id);
  }

  @Get('agenda/:idAgendaProfesional')
  @HttpCode(HttpStatus.OK)
  @ApiFindAllByParamOperation(
    JornadaDiaria,
    'Busca jornadas diarias por ID de agenda profesional',
    'idAgendaProfesional',
    JornadaDiaria,
  )
  async findByAgendaProfesionalId(
    @Param('idAgendaProfesional', ParseUUIDPipe) idAgendaProfesional: string,
  ): Promise<JornadaDiaria[]> {
    return this.jornadaDiariaService.findByAgendaProfesionalId(
      idAgendaProfesional,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiUpdateOperation(
    JornadaDiaria,
    'Actualiza parcialmente una jornada diaria por su ID',
  )
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) de la Jornada Diaria a actualizar.',
  })
  async actualiza(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJornadaDiariaDto: UpdateJornadaDiariaDto,
  ): Promise<JornadaDiaria> {
    return this.jornadaDiariaService.actualiza(id, updateJornadaDiariaDto);
  }
}
