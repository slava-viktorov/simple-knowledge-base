import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      return super.canActivate(context);
    } catch {
      return true;
    }
  }

  handleRequest<TUser>(err: unknown, user: TUser | false | null): TUser {
    if (err instanceof UnauthorizedException) {
      return undefined as unknown as TUser;
    }
    if (!user) {
      return undefined as unknown as TUser;
    }
    return user as TUser;
  }
}
