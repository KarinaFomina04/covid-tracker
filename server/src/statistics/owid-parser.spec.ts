import { parseOwidCsv } from './owid-parser';

const SOURCE_URL = 'https://example.org/statistics.csv';
const FETCHED_AT = '2020-12-31T10:00:00.000Z';

const CSV = [
  'iso_code,continent,location,last_updated_date,total_cases,new_cases,total_deaths,new_deaths,population,total_tests,new_tests,positive_rate',
  'OWID_WRL,,World,2020-12-30,1000,20,50,1,10000,2000,70,0.075',
  'USA,North America,"United States, America",2020-12-30,600,10,30,1,1000,2500,120,0.04',
  'POL,Europe,Poland,2020-12-30,200,,10,-2,500,,,',
  'OWID_EUR,,Europe,2020-12-30,400,5,20,0,5000,,,',
].join('\n');

describe('parseOwidCsv', () => {
  it('parses the world row and individual countries', () => {
    const data = parseOwidCsv(CSV, SOURCE_URL, FETCHED_AT);

    expect(data.world.code).toBe('OWID_WRL');
    expect(data.world.totalCases).toBe(1000);
    expect(data.countries).toHaveLength(2);
    expect(data.countries[0]).toMatchObject({
      code: 'USA',
      name: 'United States, America',
      casesPerMillion: 600000,
      totalTests: 2500,
      newTests: 120,
      testsPerThousand: 2500,
      positiveRate: 0.04,
    });
    expect(data.countries[1]).toMatchObject({
      newCases: null, newDeaths: -2, totalTests: null, newTests: null, positiveRate: null,
    });
    expect(data.fetchedAt).toBe(FETCHED_AT);
  });

  it('accepts source files without the optional testing columns', () => {
    const header = CSV.split('\n')[0].replace(',total_tests,new_tests,positive_rate', '');
    const records = CSV.split('\n').slice(1).map((line) => line.replace(/,[^,]*,[^,]*,[^,]*$/, ''));
    const data = parseOwidCsv([header, ...records].join('\n'), SOURCE_URL, FETCHED_AT);
    expect(data.world.totalTests).toBeNull();
    expect(data.countries[0].positiveRate).toBeNull();
  });

  it('ignores invalid positive test rates', () => {
    const data = parseOwidCsv(CSV.replace('2500,120,0.04', '2500,120,1.5'), SOURCE_URL, FETCHED_AT);
    expect(data.countries[0].positiveRate).toBeNull();
  });

  it('rejects data with an invalid header', () => {
    expect(() => parseOwidCsv('code,name\nUSA,USA', SOURCE_URL, FETCHED_AT)).toThrow(
      'unexpected format',
    );
  });

  it('ignores countries with invalid report dates', () => {
    const csv = CSV.replace('USA,North America,"United States, America",2020-12-30',
      'USA,North America,"United States, America",2020-13-30');
    const result = parseOwidCsv(csv, SOURCE_URL, FETCHED_AT);
    expect(result.countries.map((country) => country.code)).toEqual(['POL']);
  });

  it('rejects data without a world row', () => {
    const csv = CSV.split('\n').filter((line) => !line.startsWith('OWID_WRL')).join('\n');
    expect(() => parseOwidCsv(csv, SOURCE_URL, FETCHED_AT)).toThrow(
      'World statistics are missing',
    );
  });
});
