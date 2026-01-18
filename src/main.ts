import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  // Crea la instancia de la aplicación NestJS
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // ----------------------------------------------------
  // 🔥 CONFIGURACIÓN CORS (Cross-Origin Resource Sharing)
  // ----------------------------------------------------
  app.enableCors({
    origin: 'http://localhost:5173', // Permite solo peticiones desde el origen del frontend de Vite/React
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    credentials: true, // Importante si manejas cookies o sesiones (aunque para JWT no es crítico, es buena práctica)
  });
  // ----------------------------------------------------

  // --- ¡AÑADE ESTA LÍNEA PARA HABILITAR EL PARSEO DE JSON EXPLÍCITAMENTE! ---
  app.use(express.json()); // Habilita el middleware para parsear cuerpos JSON
  // --- FIN DE LA ADICIÓN ---

  // --- ¡LÍNEA PARA HABILITAR EL VALIDATIONPIPE GLOBALMENTE! ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están definidas en el DTO
      forbidNonWhitelisted: true, // Lanza un error si hay propiedades no definidas
      transform: true, // Transforma el payload a una instancia del DTO
    }),
  );
  // --- FIN DE LA ADICIÓN ---

  // Obtén el servicio de configuración para acceder a las variables de entorno
  const configService = app.get(ConfigService);

  // Usa la variable de entorno 'PORT' o un valor por defecto (ej. 3000)
  const port = configService.get<number>('PORT') || 3000;

  // Configuración de Swagger
  setupSwagger(app);

  // Escucha en el puerto configurado
  await app.listen(port);

  // Muestra el enlace y el puerto en la consola una vez que la aplicación ha iniciado
  console.log(`🚀 La aplicación está corriendo en: http://localhost:${port}`);
}
// Llama a la función bootstrap y maneja cualquier error potencial
bootstrap().catch((err) => console.error(err));
