import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const PARTNER_RESTAURANT_RESOLVER = Symbol('PARTNER_RESTAURANT_RESOLVER');

export interface PartnerRequest {
  headers: Record<string, string | string[] | undefined>;
  restaurantId?: string;
}

/** Maps the signed-in partner of a request to their restaurant id, or null when not signed in. */
export interface PartnerRestaurantResolver {
  resolve(request: PartnerRequest): Promise<string | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DEVELOPMENT ONLY. Trusts an `X-Restaurant-Id` header, and only when PARTNER_AUTH_STUB=1
 * (default off, so partner routes answer 401). It is not authentication: this story must not
 * reach production until the authentication story replaces it with a real resolver.
 */
@Injectable()
export class DevStubRestaurantResolver implements PartnerRestaurantResolver {
  async resolve(request: PartnerRequest): Promise<string | null> {
    if (process.env.PARTNER_AUTH_STUB !== '1') return null;
    const header = request.headers['x-restaurant-id'];
    return typeof header === 'string' && UUID.test(header) ? header : null;
  }
}

@Injectable()
export class PartnerRestaurantGuard implements CanActivate {
  constructor(
    @Inject(PARTNER_RESTAURANT_RESOLVER) private readonly resolver: PartnerRestaurantResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PartnerRequest>();
    const restaurantId = await this.resolver.resolve(request);
    if (!restaurantId) throw new UnauthorizedException('Sign in as a restaurant partner');
    request.restaurantId = restaurantId;
    return true;
  }
}

export const RestaurantId = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  context.switchToHttp().getRequest<PartnerRequest>().restaurantId,
);
