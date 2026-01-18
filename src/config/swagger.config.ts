// src/config/swagger.config.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Agenda de Salud')
    .setDescription(
      'Documentación de la API para la gestión de Agenda de Salud',
    )
    .setVersion('1.0')
    .addTag('Roles', 'Gestión de roles de usuario')
    .addTag('Usuarios', 'Gestión de usuarios del sistema')
    .addTag(
      'Servicios',
      'Gestión de los servicios que prestan los profesionales de salud',
    )
    .addTag('Profesionales', 'Gestión de los profesionales de la salud')
    .addTag(
      'Agendas Profesionales',
      'Gestión de las agendas de profesionales de la salud',
    )
    .addTag('App', 'Disponibilidad de la aplicación')
    .addTag('Autenticación', 'Gestión de la autenticación')
    .addTag('Centros de Salud', 'Gestión de espacios físicls de atención')
    .addTag('Citas', 'Gestión de las citas de pacientes')
    .addTag('Descansos', 'Gestión de los descansos y pausas')
    .addTag('Jornadas Diarias', 'Gestión de las jornadas diarias')
    .addTag('Pacientes', 'Gestión de los pacientes')
    .addTag('Profesional Servicios', 'Gestión de profesionales y sus servicios')
    .addTag(
      'Slots de Disponibilidad',
      'Gestión de los slots/espacios en la agenda',
    )
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
    customSiteTitle: 'Documentación API Agenda',
  });
}
