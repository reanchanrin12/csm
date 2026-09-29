import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@csm/contracts';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) return null;
    return data ? user[data] : user;
  },
);
