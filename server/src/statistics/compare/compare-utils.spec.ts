import { alignedValues, comparisonDates, parseComparisonCodes } from './compare-utils';
import { HistoryResponse } from '../history/history.types';

function history(code: string, dates: string[], values: Array<number | null>): HistoryResponse {
  return {
    code, from: dates[0], to: dates[dates.length - 1],
    lastObservation: dates[dates.length - 1], source: 'Our World in Data',
    fetchedAt: '2020-12-31T12:00:00Z',
    points: dates.map((date, index) => ({
      date, totalCases: values[index], newCases: values[index],
      newCasesAverage: values[index], totalDeaths: 1, newDeaths: 0, newDeathsAverage: 0,
    })),
  };
}

describe('Country comparison calculations', () => {
  it('accepts two to four unique ISO country codes', () => {
    expect(parseComparisonCodes('pol, USA ')).toEqual(['POL', 'USA']);
    expect(() => parseComparisonCodes('POL')).toThrow();
    expect(() => parseComparisonCodes('POL,pol')).toThrow();
    expect(() => parseComparisonCodes('POL,USA,ITA,ESP,FRA')).toThrow();
    expect(() => parseComparisonCodes('POL,OWID_WRL')).toThrow();
  });

  it('uses the common reporting window and anchors periods to its last date', () => {
    const a = history('POL', ['2020-12-28', '2020-12-29', '2020-12-30', '2020-12-31'], [1, 2, 3, 4]);
    const b = history('USA', ['2020-12-29', '2020-12-30'], [2, 4]);
    expect(comparisonDates([a, b], { period: '30d' })).toEqual(['2020-12-29', '2020-12-30']);
    expect(() => comparisonDates([a, b], { from: '2021-01-01' })).toThrow();
    expect(() => comparisonDates([a, b], { period: '7d', from: '2020-12-29' })).toThrow();
    expect(() => comparisonDates([a, b], { from: '2020-02-30' })).toThrow();
  });

  it('aligns by date without treating gaps as zero', () => {
    const a = history('POL', ['2020-12-28', '2020-12-30'], [100, -5]);
    expect(alignedValues(a, ['2020-12-28', '2020-12-29', '2020-12-30'], 'newCases', 'absolute', 500))
      .toEqual([100, null, -5]);
    expect(alignedValues(a, ['2020-12-28', '2020-12-29', '2020-12-30'], 'newCases', 'perMillion', 500))
      .toEqual([200000, null, -10000]);
    expect(alignedValues(a, ['2020-12-28'], 'newCases', 'perMillion', null)).toEqual([null]);
  });
});
