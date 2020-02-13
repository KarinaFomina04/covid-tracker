import axios = require('axios');
import { Readable } from 'stream';
import { HistorySourceService } from './history-source.service';

jest.mock('axios');

const fetch = axios.get as unknown as jest.Mock;
const header = 'iso_code,continent,location,date,total_cases,new_cases,total_deaths,new_deaths';

function respond(rows: string[], contentLength?: number): Readable {
  const csv = [header, ...rows].join('\n');
  const stream = Readable.from([Buffer.from(csv)]);
  fetch.mockResolvedValueOnce({
    data: stream,
    headers: { 'content-length': String(contentLength === undefined ? Buffer.byteLength(csv) : contentLength) },
  });
  return stream;
}

describe('HistorySourceService', () => {
  beforeEach(() => fetch.mockReset());

  it('streams observations, sorts by date and keeps the most recent duplicate row', async () => {
    respond([
      'OWID_WRL,,World,2020-12-30,100,5,10,1',
      'USA,North America,United States,2020-12-31,30,3,2,0',
      'USA,North America,United States,2020-12-30,20,2,2,0',
      'USA,North America,United States,2020-12-31,31,4,2,0',
      'OWID_EUR,,Europe,2020-12-30,50,3,3,0',
      'ITA,,Italy,2020-12-30,8,2,0,0',
      'POL,Europe,Poland,invalid,8,2,0,0',
    ]);

    const result = await new HistorySourceService().fetchDataset();
    expect(Object.keys(result.records).sort()).toEqual(['OWID_WRL', 'USA']);
    expect(result.records.USA.map((record) => record.date)).toEqual(['2020-12-30', '2020-12-31']);
    expect(result.records.USA[1]).toMatchObject({ totalCases: 31, newCases: 4 });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('.csv'), expect.objectContaining({
      responseType: 'stream', timeout: 120000,
    }));
  });

  it('preserves empty values and negative source corrections', async () => {
    respond([
      'OWID_WRL,,World,2020-12-30,100,5,10,1',
      'POL,Europe,Poland,2020-12-30,,-3,,0',
    ]);
    const result = await new HistorySourceService().fetchDataset();
    expect(result.records.POL[0]).toMatchObject({ totalCases: null, newCases: -3, totalDeaths: null });
  });

  it('rejects incomplete source headers', async () => {
    const stream = Readable.from([Buffer.from('code,date,total_cases\nPOL,2020-12-30,10')]);
    fetch.mockResolvedValueOnce({ data: stream, headers: {} });
    await expect(new HistorySourceService().fetchDataset()).rejects.toThrow('unexpected format');
  });

  it('rejects oversized sources before parsing', async () => {
    const stream = respond(['OWID_WRL,,World,2020-12-30,100,5,10,1'], 161 * 1024 * 1024);
    await expect(new HistorySourceService().fetchDataset()).rejects.toThrow('too large');
    expect(stream.destroyed).toBe(true);
  });

  it('rejects a dataset with no world observations', async () => {
    respond(['POL,Europe,Poland,2020-12-30,10,1,0,0']);
    await expect(new HistorySourceService().fetchDataset()).rejects.toThrow('no usable observations');
  });
});
