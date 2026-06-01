// ENJIN 2026 GUIDE BOOK — Google Apps Script
// スプレッドシートID: 1qMVnGxnVMy-Y2azbHT2DV2Z-3OnojAKtpb-calV3lw4

const SS       = SpreadsheetApp.openById('1qMVnGxnVMy-Y2azbHT2DV2Z-3OnojAKtpb-calV3lw4');
const MEMBERS  = SS.getSheetByName('guidebook_members');
const PROFILES = SS.getSheetByName('guidebook_profiles');
const AUTH     = SS.getSheetByName('auth');

const PROFILE_HEADERS = ['edit_id', 'enjin_type', 'can_give', 'need_help', 'message', 'updated_at'];

// =========================================================
// API: GET
// =========================================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  const out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);

  // --- パスワード認証 ---
  if (action === 'auth') {
    const password = e.parameter.password || '';
    const correct  = String(AUTH.getRange('A1').getValue()).trim();
    out.setContent(JSON.stringify({ ok: password === correct }));
    return out;
  }

  // --- 参加者一覧 ---
  if (action === 'participants') {
    // guidebook_members を読む
    const memberRows = MEMBERS.getDataRange().getValues();
    const memberHdr  = memberRows[0].map(h => String(h).trim());
    const members = memberRows.slice(1)
      .filter(r => r[0])  // edit_idが空の行は非公開
      .map(r => {
        const obj = {};
        memberHdr.forEach((h, i) => { obj[h] = r[i]; });
        return obj;
      });

    // guidebook_profiles を読んで edit_id をキーにしたマップを作る
    const profileRows = PROFILES.getDataRange().getValues();
    const profileMap  = {};
    if (profileRows.length > 1) {
      const profileHdr = profileRows[0];
      profileRows.slice(1).filter(r => r[0]).forEach(r => {
        const obj = {};
        profileHdr.forEach((h, i) => { obj[h] = r[i]; });
        profileMap[obj.edit_id] = obj;
      });
    }

    // 結合：members の基本情報 + profiles の自己入力情報
    const data = members.map(m => ({
      ...m,
      ...(profileMap[m.edit_id] || {})
    }));

    out.setContent(JSON.stringify({ ok: true, data }));
    return out;
  }

  out.setContent(JSON.stringify({ ok: false, error: 'unknown action' }));
  return out;
}

// =========================================================
// API: POST（プロフィール更新）
// =========================================================
function doPost(e) {
  const out = ContentService.createTextOutput();
  out.setMimeType(ContentService.MimeType.JSON);

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (_) {
    out.setContent(JSON.stringify({ ok: false, error: 'invalid JSON' }));
    return out;
  }

  const { edit_id, enjin_type, can_give, need_help, message } = body;
  if (!edit_id) {
    out.setContent(JSON.stringify({ ok: false, error: 'edit_id required' }));
    return out;
  }

  // guidebook_profiles を upsert（あれば更新・なければ追記）
  const rows = PROFILES.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === edit_id) {
      const rowNum = i + 1;
      PROFILES.getRange(rowNum, 2).setValue(enjin_type !== undefined ? enjin_type : rows[i][1]);
      PROFILES.getRange(rowNum, 3).setValue(can_give   !== undefined ? can_give   : rows[i][2]);
      PROFILES.getRange(rowNum, 4).setValue(need_help  !== undefined ? need_help  : rows[i][3]);
      PROFILES.getRange(rowNum, 5).setValue(message    !== undefined ? message    : rows[i][4]);
      PROFILES.getRange(rowNum, 6).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }
  if (!found) {
    PROFILES.appendRow([
      edit_id,
      enjin_type || '',
      can_give   || '',
      need_help  || '',
      message    || '',
      new Date().toISOString()
    ]);
  }

  out.setContent(JSON.stringify({ ok: true }));
  return out;
}

// =========================================================
// セットアップ関数（それぞれ1回だけ実行する）
// =========================================================

// 1. guidebook_profiles のヘッダー行を作成（既にある場合はスキップ）
function initProfilesSheet() {
  if (PROFILES.getLastRow() === 0) {
    PROFILES.appendRow(PROFILE_HEADERS);
  }
}

// 2. auth シートにパスワードをセット
//    → A1セルの値を変えてから実行（またはシートに直接入力してもOK）
function initAuthSheet() {
  AUTH.getRange('A1').setValue('en2026');
}

// 3. guidebook_members の全行に edit_id を生成（空行のみ・既存は絶対に上書きしない）
//    → 参加者を追加したときに再実行してOK
function generateEditIds() {
  const rows    = MEMBERS.getDataRange().getValues();
  const headers = rows[0].map(h => String(h).trim());
  const idx     = headers.indexOf('edit_id');

  rows.slice(1).forEach((row, i) => {
    if (row[idx]) return; // 既存の edit_id は変更しない
    const newId = 'enjin-' + Math.random().toString(36).slice(2, 6);
    MEMBERS.getRange(i + 2, idx + 1).setValue(newId);
  });
}
