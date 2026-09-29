'use strict';

(function exposePriceCsv(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MarketPriceCsv = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const HEADERS = [
    'project',
    'developer',
    'area',
    'kind',
    'amount',
    'currency',
    'capturedAt',
    'unitType',
    'areaSize',
    'phase',
    'finishing',
    'terms',
    'sourceName',
    'sourceUrl',
    'authorized',
    'permissionReference',
  ];
  const REQUIRED_HEADERS = ['project', 'kind', 'amount', 'currency', 'capturedat', 'sourcename', 'authorized'];
  const PRICE_KINDS = new Set(['launch', 'resale', 'transaction', 'rent']);
  const MAX_FILE_BYTES = 1_048_576;
  const MAX_ROWS = 500;

  function parseMatrix(input) {
    const text = input.replace(/^\uFEFF/, '');
    const records = [];
    let record = [];
    let field = '';
    let quoted = false;
    let closedQuote = false;
    let line = 1;
    let recordLine = 1;

    function endField() {
      record.push(field);
      field = '';
      closedQuote = false;
    }

    function endRecord() {
      endField();
      if (record.some((cell) => cell.trim() !== '')) records.push({ cells: record, line: recordLine });
      record = [];
      line += 1;
      recordLine = line;
    }

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
          closedQuote = true;
        } else {
          field += char;
          if (char === '\n') line += 1;
        }
        continue;
      }

      if (closedQuote && char !== ',' && char !== '\r' && char !== '\n' && char !== ' ' && char !== '\t') {
        throw new Error(`Unexpected character after a quoted field on line ${line}.`);
      }
      if (closedQuote && (char === ' ' || char === '\t')) continue;
      if (char === '"') {
        if (field.length) throw new Error(`Unexpected quote on line ${line}.`);
        quoted = true;
      } else if (char === ',') {
        endField();
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        endRecord();
      } else {
        field += char;
      }
    }

    if (quoted) throw new Error(`Unclosed quoted field starting on line ${recordLine}.`);
    if (field.length || record.length || closedQuote) endRecord();
    return records;
  }

  function cleanText(value) {
    return String(value ?? '')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parsePositiveNumber(value, optional = false) {
    const text = String(value ?? '').trim();
    if (!text && optional) return { value: null };
    if (!/^\d+(?:\.\d+)?$/.test(text)) return { error: 'Use digits only (no thousands separators); decimal point is optional.' };
    const number = Number(text);
    if (!Number.isFinite(number) || number <= 0) return { error: 'Enter a number greater than zero.' };
    return { value: number };
  }

  function validDate(value, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day && value <= today;
  }

  function normalizeUrl(value) {
    const text = String(value ?? '').trim();
    if (!text) return { value: '' };
    if (text.length > 500) return { error: 'Source URLs must be 500 characters or shorter.' };
    try {
      const url = new URL(text);
      if (url.protocol !== 'https:' || url.username || url.password) return { error: 'Source links must be HTTPS and must not contain credentials.' };
      url.search = '';
      url.hash = '';
      return { value: url.toString() };
    } catch {
      return { error: 'Enter a valid HTTPS source URL, or leave it blank.' };
    }
  }

  function parseDailyPriceCsv(input, options = {}) {
    const today = options.today || new Date().toISOString().slice(0, 10);
    const maxRows = options.maxRows || MAX_ROWS;
    const errors = [];
    if (typeof input !== 'string') return { headers: [], rows: [], errors: [{ line: 1, message: 'The selected file is not readable text.' }] };
    if (new TextEncoder().encode(input).length > (options.maxBytes || MAX_FILE_BYTES)) {
      return { headers: [], rows: [], errors: [{ line: 1, message: 'The CSV is too large. Maximum file size is 1 MiB.' }] };
    }

    let records;
    try {
      records = parseMatrix(input);
    } catch (error) {
      return { headers: [], rows: [], errors: [{ line: 1, message: error.message }] };
    }
    if (records.length < 2) return { headers: [], rows: [], errors: [{ line: 1, message: 'Add the template header and at least one price row.' }] };

    const headers = records[0].cells.map((cell) => cell.trim().toLowerCase());
    const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);
    if (duplicateHeaders.length) errors.push({ line: records[0].line, message: `Duplicate column name: ${duplicateHeaders[0]}.` });
    REQUIRED_HEADERS.forEach((header) => {
      if (!headers.includes(header)) errors.push({ line: records[0].line, message: `Missing required column: ${header}.` });
    });
    if (errors.length) return { headers, rows: [], errors };

    const dataRecords = records.slice(1);
    if (dataRecords.length > maxRows) {
      return { headers, rows: [], errors: [{ line: records[maxRows + 1]?.line || records.at(-1).line, message: `This file has more than ${maxRows} price rows. Split it into smaller daily batches.` }] };
    }

    const column = Object.fromEntries(headers.map((header, index) => [header, index]));
    const rows = [];
    dataRecords.forEach(({ cells, line }) => {
      if (cells.length > headers.length) {
        errors.push({ line, message: 'This row has more values than the header. Check commas and quotes.' });
        return;
      }
      const get = (name) => cells[column[name]] ?? '';
      const value = {
        project: cleanText(get('project')),
        developer: cleanText(get('developer')),
        area: cleanText(get('area')),
        kind: cleanText(get('kind')).toLowerCase(),
        capturedAt: cleanText(get('capturedat')),
        unitType: cleanText(get('unittype')),
        phase: cleanText(get('phase')),
        finishing: cleanText(get('finishing')),
        terms: cleanText(get('terms')),
        sourceName: cleanText(get('sourcename')),
        permissionReference: cleanText(get('permissionreference')),
      };
      const rowErrors = [];
      const amount = parsePositiveNumber(get('amount'));
      const areaSize = parsePositiveNumber(get('areasize'), true);
      const sourceUrl = normalizeUrl(get('sourceurl'));
      if (!value.project) rowErrors.push('Project is required.');
      if (!value.sourceName) rowErrors.push('Source name or document reference is required.');
      [
        ['project', value.project, 100], ['developer', value.developer, 100], ['area', value.area, 100],
        ['unitType', value.unitType, 80], ['phase', value.phase, 100], ['finishing', value.finishing, 80],
        ['terms', value.terms, 180], ['sourceName', value.sourceName, 120], ['permissionReference', value.permissionReference, 200],
      ].forEach(([fieldName, fieldValue, maxLength]) => {
        if (fieldValue.length > maxLength) rowErrors.push(`${fieldName} must be ${maxLength} characters or shorter.`);
      });
      if (!PRICE_KINDS.has(value.kind)) rowErrors.push('Kind must be launch, resale, transaction, or rent.');
      if (get('currency').trim().toUpperCase() !== 'EGP') rowErrors.push('Currency must be EGP.');
      if (amount.error) rowErrors.push(`Amount: ${amount.error}`);
      if (areaSize.error) rowErrors.push(`Area size: ${areaSize.error}`);
      if (!validDate(value.capturedAt, today)) rowErrors.push('Capture date must be a real YYYY-MM-DD date and cannot be in the future.');
      if (get('authorized').trim().toUpperCase() !== 'YES') rowErrors.push('Set authorized to YES only for facts Xcelias has permission to use.');
      if (sourceUrl.error) rowErrors.push(sourceUrl.error);
      if (rowErrors.length) {
        errors.push({ line, message: rowErrors.join(' ') });
        return;
      }
      value.amount = amount.value;
      value.areaSize = areaSize.value;
      value.sourceUrl = sourceUrl.value;
      value.authorized = true;
      value.csvLine = line;
      rows.push(value);
    });
    return { headers, rows, errors };
  }

  function duplicateKey(item) {
    const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
    return [
      item.project,
      item.developer,
      item.kind,
      item.capturedAt,
      item.amount,
      item.areaSize,
      item.unitType,
      item.phase,
      item.finishing,
      item.terms,
      item.sourceName,
    ].map(normalize).join('|');
  }

  function csvTemplate() {
    return `${HEADERS.join(',')}\r\n`;
  }

  return { HEADERS, MAX_FILE_BYTES, MAX_ROWS, csvTemplate, duplicateKey, parseDailyPriceCsv };
});
