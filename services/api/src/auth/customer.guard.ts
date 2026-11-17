import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PRINCIPAL_RESOLVER, type PrincipalResolver } from './partner.guard';

@Injectable()
export class CustomerGuard implements CanActivate {
  constructor(@Inject(PRINCIPAL_RESOLVER) private readonly resolver: PrincipalResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const principal = await this.resolver.resolve(context.switchToHttp().getRequest());
    if (!principal) throw new UnauthorizedException('Sign in to continue');
    if (principal.role !== 'customer') throw new ForbiddenException('Only a customer can place an order');
    return true;
  }
}
