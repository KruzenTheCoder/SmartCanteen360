import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestUser {
  userId: string;
  roles: string[];
  permissions: string[];
  companyId?: string | null;
}

/**
 * Enforces `@RequirePermissions('<resource>:<action>')`. SUPER_ADMIN is an
 * implicit wildcard. Permission keys come from the shared RBAC catalogue and are
 * attached to `req.user.permissions` by the JWT strategy.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<{ user?: RequestUser }>().user;
    if (!user) {
      throw new ForbiddenException('Missing authenticated user');
    }

    if (user.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    const granted = new Set(user.permissions ?? []);
    const ok = required.every((permission) => granted.has(permission));
    if (!ok) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }
    return true;
  }
}
