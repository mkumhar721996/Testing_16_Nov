import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { validateWeek, WEEKDAYS, type Slot, type Weekday, type WeekHours } from './opening-hours.domain';
import { OPENING_HOURS_REPOSITORY, type OpeningHoursRepository } from './opening-hours.repository';

export interface OpeningHoursDto {
  city: string;
  timeZone: string;
  temporarilyClosed: boolean;
  days: Record<Weekday, { slots: Slot[] }>;
}

@Injectable()
export class OpeningHoursService {
  constructor(@Inject(OPENING_HOURS_REPOSITORY) private readonly repository: OpeningHoursRepository) {}

  async getHours(restaurantId: string): Promise<OpeningHoursDto> {
    const found = await this.repository.find(restaurantId);
    if (!found) throw new NotFoundException('Restaurant not found');
    const days = {} as OpeningHoursDto['days'];
    for (const weekday of WEEKDAYS) days[weekday] = { slots: found.hours[weekday] };
    return { city: found.city, timeZone: found.timeZone, temporarilyClosed: found.temporarilyClosed, days };
  }

  async saveHours(restaurantId: string, week: WeekHours): Promise<OpeningHoursDto> {
    const problems = validateWeek(week);
    if (problems.length > 0) {
      throw new BadRequestException({
        code: 'INVALID_OPENING_HOURS',
        message: 'Opening hours were not saved.',
        problems,
      });
    }
    await this.getHours(restaurantId);
    await this.repository.replaceWeek(restaurantId, week);
    return this.getHours(restaurantId);
  }

  async setTemporarilyClosed(restaurantId: string, closed: boolean): Promise<OpeningHoursDto> {
    await this.getHours(restaurantId);
    await this.repository.setTemporarilyClosed(restaurantId, closed);
    return this.getHours(restaurantId);
  }
}
