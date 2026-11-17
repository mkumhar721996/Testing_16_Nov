import { BadRequestException, Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { PartnerGuard } from '../auth/partner.guard';
import { emptyWeek, WEEKDAYS, type Slot, type Weekday } from './opening-hours.domain';
import { OpeningHoursService, type OpeningHoursDto } from './opening-hours.service';

export interface SaveHoursBody {
  days: { weekday: Weekday; slots: Slot[] }[];
}

/** The guard has already attached the signed-in partner's own restaurant. */
interface OwnRestaurant {
  restaurantId?: string;
}

@Controller('partner/restaurant')
@UseGuards(PartnerGuard)
export class OpeningHoursController {
  constructor(private readonly service: OpeningHoursService) {}

  @Get('opening-hours')
  get(@Req() request: OwnRestaurant): Promise<OpeningHoursDto> {
    return this.service.getHours(request.restaurantId!);
  }

  @Put('opening-hours')
  async save(@Req() request: OwnRestaurant, @Body() body: SaveHoursBody): Promise<OpeningHoursDto> {
    const week = emptyWeek();
    const seen = new Set<Weekday>();
    for (const day of Array.isArray(body?.days) ? body.days : []) {
      if (!WEEKDAYS.includes(day?.weekday) || !Array.isArray(day.slots) || seen.has(day.weekday)) {
        throw new BadRequestException('Each weekday must appear once with a list of slots');
      }
      seen.add(day.weekday);
      week[day.weekday] = day.slots.map((s) => ({ opensAt: String(s?.opensAt), closesAt: String(s?.closesAt) }));
    }
    if (seen.size !== WEEKDAYS.length) throw new BadRequestException('Send all seven weekdays');
    return this.service.saveHours(request.restaurantId!, week);
  }

  @Put('temporary-closure')
  async setClosure(@Req() request: OwnRestaurant, @Body() body: { closed: boolean }): Promise<OpeningHoursDto> {
    if (typeof body?.closed !== 'boolean') throw new BadRequestException('closed must be true or false');
    return this.service.setTemporarilyClosed(request.restaurantId!, body.closed);
  }
}
