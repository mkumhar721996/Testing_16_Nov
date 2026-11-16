import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';

export const PARTNER_RESTAURANT_HEADER = 'x-partner-restaurant-id';

// Development-only stand-in for real authentication (Entra ID arrives in a later story).
@Injectable()
export class PartnerRestaurantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Fail closed: the header is forgeable, so it must never authorise anything in production.
    // TODO: replace with Entra ID authentication (ADR-0008, ADR-0011) in its own story.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Partner authentication is not available yet');
    }
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const restaurantId = req.headers[PARTNER_RESTAURANT_HEADER];
    if (!restaurantId) throw new UnauthorizedException('Partner restaurant is required');
    return true;
  }
}
