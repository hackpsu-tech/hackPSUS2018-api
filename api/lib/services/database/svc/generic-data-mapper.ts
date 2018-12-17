import { Inject } from 'injection-js';
import { AuthLevel } from '../../auth/auth-types';
import { IAcl } from '../../auth/RBAC/rbac-types';
import { Role } from '../../auth/RBAC/Role';

export abstract class GenericDataMapper {

  protected abstract tableName: string;
  protected abstract pkColumnName: string;

  protected constructor(@Inject('RBAC') protected acl: IAcl) {
  }

  protected addRBAC(
    role: string | string[],
    levels: AuthLevel[],
    action?: (params: any) => boolean,
    inherits?: string[],
  ) {
    levels.forEach(
      level => this.acl.registerRBAC(new Role(
        AuthLevel[level],
        Array.isArray(role) ? role : [role],
        action,
        inherits,
      )));
  }
}
