import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

export const PARTNER_RESTAURANT_HEADER = 'x-partner-restaurant-id';

// Development-only stand-in for real authentication (Entra ID arrives in a later story).
@Injectable()
export class PartnerRestaurantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const restaurantId = req.headers[PARTNER_RESTAURANT_HEADER];
    if (!restaurantId) throw new UnauthorizedException('Partner restaurant is required');
    return true;
  }
}
