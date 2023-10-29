import { Controller, Get, Param } from '@nestjs/common';
import { AppGettingStats } from './app.service';

@Controller('rates')
export class AppController {
  constructor(private readonly appService: AppGettingStats) {}

  @Get(':currency/:year/stats')
  async getRatesStats(
    @Param('currency') currency: string,
    @Param('year') year: number,
  ): Promise<any> {
    return await this.appService.getYearStat(year, currency);
  }

  @Get('pair-currency')
  async getListPair(): Promise<Array<string>> {
    return await this.appService.getListPairCurrency();
  }
}
