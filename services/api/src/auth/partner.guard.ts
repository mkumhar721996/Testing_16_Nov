import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

export const PRINCIPAL_RESOLVER = 'PRINCIPAL_RESOLVER';

export interface Principal {
  role: 'partner' | 'customer';
  tenantId: string;
  /** The one restaurant a partner manages; unset for customers. */
  restaurantId?: string;
}

/** Turns a request's credentials into a Principal (null when not signed in). The Entra ID resolver plugs in here. */
export interface PrincipalResolver {
  resolve(request: unknown): Promise<Principal | null>;
}

export interface PartnerRequest {
  restaurantId?: string;
}

@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(@Inject(PRINCIPAL_RESOLVER) private readonly resolver: PrincipalResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PartnerRequest>();
    const principal = await this.resolver.resolve(request);
    if (!principal) throw new UnauthorizedException('Sign in to continue');
    if (principal.role !== 'partner' || !principal.restaurantId) {
      throw new ForbiddenException('Only a restaurant partner can do this');
    }
    request.restaurantId = principal.restaurantId;
    return true;
  }
}
