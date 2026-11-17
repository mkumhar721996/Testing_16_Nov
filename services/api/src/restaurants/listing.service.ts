import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Actor, ActorRole } from '../auth/actor';
import { DuplicateOwnerError, LISTING_REPOSITORY, type ListingRepository } from './listing.repository';
import { LISTING_FIELDS, type Listing, type ListingInput } from './listing.types';

function requireRole(actor: Actor | null | undefined, role: ActorRole): Actor {
  if (!actor) throw new UnauthorizedException('Sign in to continue');
  if (actor.role !== role) throw new ForbiddenException(`Only a ${role} can do this`);
  return actor;
}

function validate(input: ListingInput): ListingInput {
  const empty = LISTING_FIELDS.filter((f) => typeof input?.[f] !== 'string' || input[f].trim() === '');
  if (empty.length > 0) throw new BadRequestException({ message: `Fill in every field: ${empty.join(', ')}`, fields: empty });
  return Object.fromEntries(LISTING_FIELDS.map((f) => [f, input[f].trim()])) as unknown as ListingInput;
}

@Injectable()
export class ListingService {
  constructor(@Inject(LISTING_REPOSITORY) private readonly repo: ListingRepository) {}

  async create(actor: Actor | null, input: ListingInput): Promise<Listing> {
    const partner = requireRole(actor, 'partner');
    const clean = validate(input);
    if (await this.repo.findByOwner(partner.id)) throw new ConflictException('You already have a listing');
    try {
      return await this.repo.insert(partner.id, clean);
    } catch (err) {
      if (err instanceof DuplicateOwnerError) throw new ConflictException('You already have a listing');
      throw err;
    }
  }

  async getMine(actor: Actor | null): Promise<Listing> {
    const partner = requireRole(actor, 'partner');
    const found = await this.repo.findByOwner(partner.id);
    if (!found) throw new NotFoundException('You have no listing yet');
    return found;
  }

  async updateMine(actor: Actor | null, input: ListingInput): Promise<Listing> {
    const partner = requireRole(actor, 'partner');
    const clean = validate(input);
    // Any edit goes back to pending approval, which also hides it from customers.
    const updated = await this.repo.updateByOwner(partner.id, clean, 'pending');
    if (!updated) throw new NotFoundException('You have no listing yet');
    return updated;
  }

  async listPending(actor: Actor | null): Promise<Listing[]> {
    requireRole(actor, 'admin');
    return this.repo.listByStatus('pending');
  }

  approve(actor: Actor | null, id: string): Promise<Listing> {
    return this.decide(actor, id, 'approved');
  }

  reject(actor: Actor | null, id: string): Promise<Listing> {
    return this.decide(actor, id, 'rejected');
  }

  listVisibleToCustomers(): Promise<Listing[]> {
    return this.repo.listByStatus('approved');
  }

  private async decide(actor: Actor | null, id: string, to: 'approved' | 'rejected'): Promise<Listing> {
    requireRole(actor, 'admin');
    const updated = await this.repo.setStatus(id, 'pending', to);
    if (updated) return updated;
    if (!(await this.repo.findById(id))) throw new NotFoundException('Listing not found');
    throw new ConflictException('Only a pending listing can be approved or rejected');
  }
}
