import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * Decorador personalizado para obtener el usuario del objeto Request.
 *
 * Se utiliza en los controladores para acceder a la información del usuario
 * que ha sido autenticado previamente por el JwtAuthGuard.
 */
export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    // 1. Extraemos el objeto request del contexto de ejecución
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    // 2. Verificamos si el usuario existe en la request.
    // Si no existe, es probable que se haya olvidado usar el JwtAuthGuard.
    if (!user) {
      throw new InternalServerErrorException(
        'Usuario no encontrado en la solicitud (¿Olvidaste el JwtAuthGuard?)',
      );
    }

    // 3. Si se pasa un argumento al decorador (ej. @GetUser('email')), devuelve esa propiedad.
    // De lo contrario, devuelve todo el objeto user.
    return data ? user[data] : user;
  },
);
