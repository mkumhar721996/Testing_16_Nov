export type ActorRole = 'partner' | 'admin' | 'customer';

export interface Actor {
  id: string;
  role: ActorRole;
}
