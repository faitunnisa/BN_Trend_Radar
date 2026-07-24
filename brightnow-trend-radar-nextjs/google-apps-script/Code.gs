/**
 * BrightNow Trend Radar → Google Sheets mirror
 *
 * SETUP:
 * 1. Create a Google Sheet.
 * 2. Extensions → Apps Script.
 * 3. Paste this file.
 * 4. Deploy → New deployment → Web app.
 * 5. Execute as: Me.
 * 6. Choose access allowed by your company policy.
 * 7. Copy the URL ending in /exec to Vercel Environment Variables:
 *    GOOGLE_SHEETS_WEBHOOK_URL
 */

const TREND_SHEET = 'Trend Submissions';
const ACTION_SHEET = 'Actions';
const LEARNING_SHEET = 'Learning Library';
const LOG_SHEET = 'Connector Log';

const TREND_HEADERS = [
  'record_type','id','created_at','observed_date','title','category','platform',
  'momentum','source','relevance','suggested_action','submitter',
  'division','votes','opportunity_score','status','received_at'
];

const ACTION_HEADERS = [
  'record_type','id','created_at','updated_at','start_date','end_date','action',
  'source_trend_id','source_trend_title','accountable',
  'status','updated_by','received_at'
];

const LEARNING_HEADERS = [
  'record_type','id','created_at','published_date','learning_title',
  'source_trend_id','source_trend_title',
  'source_action_id','source_action_title','action_owner',
  'result','what_worked','what_didnt_work','why_it_happened',
  'reusable_principle','evidence_url','received_at'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'BrightNow Trend Radar Connector',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const receivedAt = new Date();

    if (payload.record_type === 'trend_submission') {
      const sheet = ensureSheet_(ss, TREND_SHEET, TREND_HEADERS);
      upsertById_(sheet, payload.id, [
        payload.record_type || '',
        payload.id || '',
        payload.created_at || '',
        payload.observed_date || '',
        payload.title || '',
        payload.category || '',
        payload.platform || '',
        payload.momentum || '',
        payload.source || '',
        payload.relevance || '',
        payload.suggested_action || '',
        payload.submitter || '',
        payload.division || '',
        numberOrBlank_(payload.votes),
        numberOrBlank_(payload.opportunity_score),
        payload.status || '',
        receivedAt
      ]);
      return jsonResponse_({ ok: true, sheet: TREND_SHEET });
    }

    if (payload.record_type === 'action') {
      const sheet = ensureSheet_(ss, ACTION_SHEET, ACTION_HEADERS);
      upsertById_(sheet, payload.id, [
        payload.record_type || '',
        payload.id || '',
        payload.created_at || '',
        payload.updated_at || '',
        payload.start_date || '',
        payload.end_date || '',
        payload.title || '',
        payload.source_trend_id || '',
        payload.source_trend_title || '',
        payload.accountable || '',
        payload.status || '',
        payload.updated_by || '',
        receivedAt
      ]);
      return jsonResponse_({ ok: true, sheet: ACTION_SHEET });
    }

    if (payload.record_type === 'learning') {
      const sheet = ensureSheet_(ss, LEARNING_SHEET, LEARNING_HEADERS);
      upsertById_(sheet, payload.id, [
        payload.record_type || '',
        payload.id || '',
        payload.created_at || '',
        payload.published_date || '',
        payload.title || '',
        payload.source_trend_id || '',
        payload.source_trend_title || '',
        payload.source_action_id || '',
        payload.source_action_title || '',
        payload.action_owner || '',
        payload.result || '',
        payload.what_worked || '',
        payload.what_didnt_work || '',
        payload.why_it_happened || '',
        payload.reusable_principle || '',
        payload.evidence_url || '',
        receivedAt
      ]);
      return jsonResponse_({ ok: true, sheet: LEARNING_SHEET });
    }

    const log = ensureSheet_(
      ss,
      LOG_SHEET,
      ['record_type','id','created_at','message','received_at']
    );
    log.appendRow([
      payload.record_type || 'unknown',
      payload.id || '',
      payload.created_at || '',
      payload.message || JSON.stringify(payload),
      receivedAt
    ]);
    return jsonResponse_({ ok: true, sheet: LOG_SHEET });

  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: String(error && error.message ? error.message : error)
    });
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#F6DE66');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertById_(sheet, id, row) {
  if (!id) {
    sheet.appendRow(row);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat();
    const index = ids.findIndex(value => String(value) === String(id));
    if (index >= 0) {
      sheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function numberOrBlank_(value) {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
