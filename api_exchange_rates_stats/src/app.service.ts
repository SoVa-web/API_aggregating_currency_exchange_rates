import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppGettingStats {
  constructor(
    private httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}
  /* 
      We set different end date values for ordinary and leap years
      because the API only provides intervals within 365 days. A
      crutch, but let it be temporarily if we don't need perfect accuracy
  */
  async getYearStat(year: number, currency: string): Promise<object> {
    const currencyFrom: string = currency.split('-')[0].toUpperCase();
    const currencyTo: string = currency.split('-')[1].toUpperCase();
    let [dataFrom, dataTo] = ['', ''];
    dataFrom = String(year) + '-01-01';

    if (year % 4) {
      dataTo = String(year) + '-12-31';
    } else {
      dataTo = String(year) + '-12-30';
    }

    const data = await this.sendReqYear(
      dataFrom,
      dataTo,
      currencyFrom,
      currencyTo,
    )
      .then((res) => {
        return this.calcStat(res, year, currencyFrom, currencyTo);
      })
      .catch((error) => {
        return error;
      });
    return data;
  }

  calcStat(
    data: object,
    year: number,
    currencyFrom: string,
    currencyTo: string,
  ): any {
    if ('rates' in data) {
      const dates = Object.keys(data.rates);
      let average: number = 0;
      let stat: object = {};
      if (typeof data.rates === 'object') {
        average = this.calcAverage(data.rates, dates, currencyTo);
        stat = this.calcCompareAverage(data.rates, dates, average, currencyTo);
      }
      let result: object = {};
      if ('equal' in stat && 'more' in stat && 'less' in stat) {
        result = {
          year: year,
          currencyTo: currencyTo,
          currencyFrom: currencyFrom,
          averageRate: average,
          countDaysEqualAverage: stat.equal,
          countDaysMoreAverage: stat.more,
          countDaysLessAverage: stat.less,
        };
      }
      return result;
    } else {
      return new Error('Currency rates not exist in response');
    }
  }

  calcCompareAverage(
    data: object,
    dates: string[],
    average: number,
    currencyTo: string,
  ): object {
    let [equal, less, more] = [0, 0, 0];
    for (const date of dates) {
      const usdValue = data[date][currencyTo];
      if (typeof usdValue === 'number') {
        if (usdValue > average) more++;
        else if (usdValue < average) less++;
        else equal++;
      }
    }
    return {
      equal: equal,
      more: more,
      less: less,
    };
  }

  async sendReqYear(
    dataFrom: string,
    dataTo: string,
    currencyFrom: string,
    currencyTo: string,
  ): Promise<any> {
    const url = `${this.configService.get(
      'URL',
    )}timeseries?start_date=${dataFrom}&end_date=${dataTo}&base=${currencyFrom}&symbols=${currencyTo}`;

    const heds = {
      headers: {
        redirect: 'follow',
        apikey: this.configService.get('TOKEN_APILAYER'),
        'Content-Type': 'application/json',
      },
    };

    const data = await fetch(url, heds)
      .then((response) => response.text())
      .then((result) => {
        return JSON.parse(result);
      })
      .catch((error) => {
        return { error: error };
      });

    return await data;
  }

  async sendCurrency(): Promise<object> {
    const url = `${this.configService.get('URL')}symbols`;

    const heds = {
      headers: {
        redirect: 'follow',
        apikey: this.configService.get('TOKEN_APILAYER'),
        'Content-Type': 'application/json',
      },
    };

    const data = await fetch(url, heds)
      .then((response) => response.text())
      .then((result) => {
        return JSON.parse(result);
      })
      .catch((error) => {
        return { error: error };
      });

    return data;
  }

  async getListPairCurrency(): Promise<Array<string>> {
    const pairCurrency: Array<string> = [];
    const listAvailableCurrency: Array<string> = await this.sendCurrency()
      .then((res) => {
        if ('symbols' in res) {
          console.log(res.symbols);
          const keys = Object.keys(res.symbols);
          keys.forEach((key1) => {
            keys.forEach((key2) => {
              if (key1 != key2) {
                pairCurrency.push(`${key1}-${key2}`);
              }
            });
          });
          return pairCurrency;
        }
      })
      .catch((error) => {
        return [error];
      });

    return listAvailableCurrency;
  }

  calcAverage(data: object, dates: string[], currencyTo: string): number {
    let fieldCount: number = 0;
    let sum: number = 0;
    for (const date of dates) {
      const usdValue = data[date][currencyTo];
      if (typeof usdValue === 'number') {
        fieldCount++;
        sum += Number(data[date][currencyTo]);
      }
    }
    return Number((sum / fieldCount).toFixed(6));
  }
}
