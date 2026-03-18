import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return data ? user[data] : user;
  },
);
