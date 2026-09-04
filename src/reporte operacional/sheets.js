const { google } = require('googleapis');

const SPREADSHEET_ID = '1CfOifudITh6PBIHeJDRldgoW6W2b2hxBJ1T_unNzEHg';

function getAuth() {
  const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// ── GET: leer todas las hojas ─────────────────────────────────────────────────
async function handleGet() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const [summary, weekly, monthly, daily] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'SUMMARY!A:F' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'WEEKLY!A:F' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MONTHLY!A:D' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'DAILY!A:J' }),
  ]);

  function rowsToObjects(data) {
    const rows = data.data.values || [];
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
    );
  }

  return {
    summary: rowsToObjects(summary),
    weekly:  rowsToObjects(weekly),
    monthly: rowsToObjects(monthly),
    daily:   rowsToObjects(daily),
  };
}

// ── POST: guardar todas las hojas ─────────────────────────────────────────────
async function handlePost(body) {
  if (body.action !== 'save_all') throw new Error('Acción desconocida: ' + body.action);
  const { summary, weekly, monthly, daily } = body.payload;

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  const summaryRows = [
    ['gusto','venta','programacion','produccion','enviado','activo'],
    ...summary.map(r => [
      r.gusto,
      r.venta        ?? 0,
      r.programacion ?? 0,
      r.produccion   ?? 0,
      r.enviado      ?? 0,
      r.activo === true || r.activo === 'true' || r.activo === 'SI' ? 'TRUE' : 'FALSE',
    ])
  ];

  // ── WEEKLY ───────────────────────────────────────────────────────────────
  const weeklyRows = [
    ['date','venta','programacion','produccion','enviado','enCurso'],
    ...weekly.map(w => [
      w.date,
      w.venta        ?? 0,
      w.programacion ?? 0,
      w.produccion   ?? 0,
      w.enviado      ?? 0,
      w.enCurso ? 'true' : 'false',
    ])
  ];

  // ── MONTHLY ──────────────────────────────────────────────────────────────
  const monthlyRows = [
    ['mes','venta','programacion','produccion'],
    ...monthly.map(m => [
      m.mes,
      m.venta        ?? 0,
      m.programacion ?? 0,
      m.produccion   ?? 0,
    ])
  ];

  // ── DAILY ────────────────────────────────────────────────────────────────
  // daily en el frontend es un objeto anidado: { label: { tipo: { gusto: { lun, mar, ... } } } }
  const dailyRows = [['label','tipo','gusto','lun','mar','mie','jue','vie','sab']];
  for (const [label, tipos] of Object.entries(daily)) {
    for (const [tipo, gustos] of Object.entries(tipos)) {
      for (const [gusto, dias] of Object.entries(gustos)) {
        dailyRows.push([
          label, tipo, gusto,
          dias.lun ?? '',
          dias.mar ?? '',
          dias.mie ?? '',
          dias.jue ?? '',
          dias.vie ?? '',
          dias.sab ?? '',
        ]);
      }
    }
  }

  // Limpiar y reescribir cada hoja
  await sheets.spreadsheets.values.batchClear({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { ranges: ['SUMMARY!A:Z', 'WEEKLY!A:Z', 'MONTHLY!A:Z', 'DAILY!A:Z'] },
  });

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: 'SUMMARY!A1', values: summaryRows },
        { range: 'WEEKLY!A1',  values: weeklyRows  },
        { range: 'MONTHLY!A1', values: monthlyRows },
        { range: 'DAILY!A1',   values: dailyRows   },
      ],
    },
  });

  return { ok: true };
}

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const data = await handleGet();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const result = await handlePost(body);
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };

  } catch (err) {
    console.error('sheets.js error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
