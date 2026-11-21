import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  id: number;
  username: string;
  email: string;
  role: string;
}

/**
 * Custom parameter decorator that extracts the authenticated JWT user (or a single field)
 * from `request.user` populated by JwtGuard.
 *
 * Examples:
 *   @CurrentUser() user: JwtUserPayload
 *   @CurrentUser('id') userId: number
 */
export const CurrentUser = createParamDecorator(
  (field: keyof JwtUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
