'use strict';

const priceCsv = require('../../Market to Mastery ( WorkSpace )/price-csv');

const header = priceCsv.csvTemplate().trimEnd();

describe('Market to Mastery daily price CSV', () => {
  test('parses a valid row and quoted commas without uploading or changing data', () => {
    const csv = `${header}\r\n"Palm, East","Example Developer",New Cairo,launch,12500000,EGP,2026-09-28,Apartment,145,Phase 2,Core and shell,"8 years, 10% down",Developer sheet,https://example.com/prices,YES,"Email approval 2026-09-28"`;
    const result = priceCsv.parseDailyPriceCsv(csv, { today: '2026-09-29' });

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      project: 'Palm, East',
      terms: '8 years, 10% down',
      amount: 12500000,
      areaSize: 145,
      permissionReference: 'Email approval 2026-09-28',
      authorized: true,
    });
  });

  test('supports escaped quotes, UTF-8 text, and newlines inside quoted cells', () => {
    const csv = `${header}\n"مشروع ""النخيل""","شركة التطوير",القاهرة الجديدة,launch,5000000,EGP,2026-09-29,Apartment,100,Phase A,Finished,"10% down\nand 7 years",Official sheet,,YES`;
    const result = priceCsv.parseDailyPriceCsv(csv, { today: '2026-09-29' });

    expect(result.errors).toEqual([]);
    expect(result.rows[0].project).toBe('مشروع "النخيل"');
    expect(result.rows[0].terms).toBe('10% down and 7 years');
    expect(result.rows[0].csvLine).toBe(2);
  });

  test('blocks rows with invalid prices, dates, currency, authorization, or source URLs', () => {
    const csv = `${header}\nExample,Builder,Cairo,launch,1e8,USD,2026-02-30,Apartment,0,Phase A,Finished,Terms,Price sheet,http://example.com,NO`;
    const result = priceCsv.parseDailyPriceCsv(csv, { today: '2026-09-29' });

    expect(result.rows).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain('Currency must be EGP');
    expect(result.errors[0].message).toContain('cannot be in the future');
    expect(result.errors[0].message).toContain('authorized to YES');
    expect(result.errors[0].message).toContain('must be HTTPS');
  });

  test('rejects malformed CSV and missing required columns', () => {
    expect(priceCsv.parseDailyPriceCsv('project,amount\n"unclosed,100', { today: '2026-09-29' }).errors[0].message).toContain('Unclosed quoted field');
    const result = priceCsv.parseDailyPriceCsv('project,amount\nExample,10', { today: '2026-09-29' });
    expect(result.errors.map((error) => error.message)).toContain('Missing required column: authorized.');
  });

  test('rejects overlong fields instead of silently truncating project/source facts', () => {
    const csv = `${header}\n"${'P'.repeat(101)}",Builder,Cairo,launch,1000000,EGP,2026-09-29,Apartment,100,Phase A,Finished,Terms,Price sheet,,YES`;
    const result = priceCsv.parseDailyPriceCsv(csv, { today: '2026-09-29' });

    expect(result.rows).toEqual([]);
    expect(result.errors[0].message).toContain('project must be 100 characters or shorter');
  });

  test('rejects oversized files and batches', () => {
    const oversized = priceCsv.parseDailyPriceCsv('x'.repeat(priceCsv.MAX_FILE_BYTES + 1), { today: '2026-09-29' });
    expect(oversized.errors[0].message).toContain('too large');

    const row = 'Example,Builder,Cairo,launch,1000000,EGP,2026-09-29,Apartment,100,Phase A,Finished,Terms,Price sheet,,YES';
    const tooMany = priceCsv.parseDailyPriceCsv(`${header}\n${Array(502).fill(row).join('\n')}`, { today: '2026-09-29' });
    expect(tooMany.rows).toEqual([]);
    expect(tooMany.errors[0].message).toContain('more than 500');
  });

  test('creates a stable duplicate identity from source, date, offer, and unit basis', () => {
    const first = { project: 'Palm East', developer: 'Builder', kind: 'launch', capturedAt: '2026-09-29', amount: 5000000, areaSize: 100, unitType: 'Apartment', phase: 'A', finishing: 'Finished', terms: '7 years', sourceName: 'Price Sheet' };
    const second = { ...first, project: ' palm   east ', sourceName: 'price sheet' };

    expect(priceCsv.duplicateKey(first)).toBe(priceCsv.duplicateKey(second));
    expect(priceCsv.duplicateKey(first)).not.toBe(priceCsv.duplicateKey({ ...first, amount: 5100000 }));
  });
});
