import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from 'src/user/enum/role.type';
import { ROLES_KEY } from '../decorators/roles.decorator';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for this route (set by @Roles() decorator)
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(), // check method-level first
      context.getClass(), // then check class-level
    ]);

    // If no @Roles() decorator is present, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request (attached by JwtAuthGuard)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = context.switchToHttp().getRequest();

    // Check if the user's role matches any of the required roles
    return requiredRoles.includes(user.role);
  }
}
