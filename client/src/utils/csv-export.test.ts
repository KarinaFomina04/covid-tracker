import { countriesToCsv, historyToCsv, serializeCsv } from './csv-export';

test('escapes commas, quotes and newlines and writes UTF-8 CSV with CRLF line endings', () => {
  expect(serializeCsv(['Name', 'Note'], [['Congo, Dem. Rep.', 'A "quoted"\nreport']]))
    .toBe('\uFEFFName,Note\r\n"Congo, Dem. Rep.","A ""quoted""\nreport"\r\n');
});

test('escapes potentially executable spreadsheet text without changing numeric corrections', () => {
  const csv = serializeCsv(['Text', 'Number'], [
    ['=HYPERLINK("https://example.org")', -12],
    [' +SUM(1,1)', 0],
    ['@SUM(1,1)', null],
  ]);
  expect(csv).toContain('"\'=HYPERLINK(""https://example.org"")",-12');
  expect(csv).toContain('"\' +SUM(1,1)",0');
  expect(csv).toContain('"\'@SUM(1,1)",');
});

test('exports country rows with missing observations left blank', () => {
  const csv = countriesToCsv([{
    code: 'POL', name: 'Poland', continent: 'Europe', date: '2020-12-10',
    population: 38000000, totalCases: 1000000, newCases: -4,
    totalDeaths: 20000, newDeaths: null, casesPerMillion: 26315.8,
    deathsPerMillion: null,
  }]);
  expect(csv).toContain('Country,ISO code,Continent,Observation date,Population');
  expect(csv).toContain('Poland,POL,Europe,2020-12-10,38000000,1000000,-4,20000,,26315.8,\r\n');
});

test('exports exactly the displayed historical series and preserves gaps', () => {
  const csv = historyToCsv({
    dates: ['2020-12-09', '2020-12-10', '2020-12-11'],
    values: [4.5, null, -1],
    label: '7-day average reported deaths per million',
    hasValues: true,
  });
  expect(csv).toBe(
    '\uFEFFDate,7-day average reported deaths per million\r\n'
    + '2020-12-09,4.5\r\n2020-12-10,\r\n2020-12-11,-1\r\n',
  );
});
