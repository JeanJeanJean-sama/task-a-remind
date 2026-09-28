/*
 * たすかReマインド Googleドライブ同期（かんたん版＝GitHub Pages版だけで使う）
 *
 * しくみ
 *   - データの本体はこれまでどおり「この端末」（localStorage）。ネットがなくても使える
 *   - 同期をオンにすると、利用者自身のGoogleドライブの「アプリ専用フォルダ（appDataFolder）」に
 *     書き出しファイルと同じ形のJSONを1つ置き、端末どうしで「取得 → 結合 → 保存」する
 *   - 結合の決まりは読み込みと同じ：同じIDなら更新日時が新しい方を残す。削除は「削除済み」の印で伝わる
 *   - 権限は drive.appdata（このアプリが作ったファイルだけ）と email（どのアカウントか表示するため）だけ。
 *     ドライブのほかのファイルは見えない
 *   - ログインの合言葉（アクセストークン）はこのブラウザのタブの中だけに置き、外には送らない
 */
var DriveSync = (function () {
  'use strict';

  var GIS_SRC = 'https://accounts.google.com/gsi/client';
  var API = 'https://www.googleapis.com/drive/v3/files';
  var UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
  var SCOPE = 'https://www.googleapis.com/auth/drive.appdata email';
  var META_KEY = 'task-a-remind/v1/sync';
  var TOKEN_KEY = 'task-a-remind/v1/sync-token';

  function readJson(storage, key) {
    try { return JSON.parse(storage.getItem(key)) || null; } catch (e) { return null; }
  }
  function writeJson(storage, key, v) {
    try { if (v == null) storage.removeItem(key); else storage.setItem(key, JSON.stringify(v)); } catch (e) { /* 保存できなくても動く */ }
  }

  var gisPromise = null;
  function loadGis() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (gisPromise) return gisPromise;
    gisPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = GIS_SRC;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { gisPromise = null; reject(new Error('Googleのログイン画面を読み込めませんでした。ネットにつながっているか確認してください')); };
      document.head.appendChild(s);
    });
    return gisPromise;
  }

  /**
   * opts: {
   *   clientId, fileName, collections: [名前...],
   *   getDb(): 今のデータ { col: [records] },
   *   applyRemote(changed: [{col, rec}]): Promise  … ドライブ側の新しい記録を端末に保存する
   *   onChange(): 状態が変わったら呼ぶ（画面の描き直し）
   *   meta: { app情報 }
   * }
   */
  function create(opts) {
    var meta = readJson(localStorage, META_KEY) || { enabled: false, fileId: '', lastSyncAt: '', email: '' };
    var tok = readJson(sessionStorage, TOKEN_KEY); // { access_token, exp }
    var st = { state: meta.enabled ? 'idle' : 'off', error: '', syncing: false, again: false };
    var tokenClient = null;
    var timer = null;

    function saveMeta() { writeJson(localStorage, META_KEY, meta); }
    function set(state, error) { st.state = state; st.error = error || ''; if (opts.onChange) opts.onChange(); }
    function tokenValid() { return !!(tok && tok.access_token && tok.exp > Date.now() + 60000); }

    function requestToken(prompt) {
      return loadGis().then(function () {
        return new Promise(function (resolve, reject) {
          if (!tokenClient) {
            tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: opts.clientId, scope: SCOPE, callback: function () {}
            });
          }
          tokenClient.callback = function (res) {
            if (!res || res.error || !res.access_token) { reject(new Error(res && res.error === 'access_denied' ? 'Googleへのログインが許可されませんでした' : 'Googleにログインできませんでした')); return; }
            tok = { access_token: res.access_token, exp: Date.now() + (Number(res.expires_in) || 3600) * 1000 };
            writeJson(sessionStorage, TOKEN_KEY, tok);
            resolve();
          };
          tokenClient.error_callback = function (err) {
            reject(new Error(err && err.type === 'popup_closed' ? 'ログインの画面が閉じられました' : 'Googleのログイン画面を開けませんでした（ポップアップがブロックされていないか確認してください）'));
          };
          tokenClient.requestAccessToken({ prompt: prompt, login_hint: meta.email || undefined });
        });
      });
    }

    function api(url, init) {
      init = init || {};
      init.headers = Object.assign({ Authorization: 'Bearer ' + tok.access_token }, init.headers || {});
      return fetch(url, init).catch(function () {
        throw new Error('ネットにつながっていないため同期できませんでした。データはこの端末に保存されています。電波が戻ると自動で同期します');
      }).then(function (res) {
        if (res.status === 401) { tok = null; writeJson(sessionStorage, TOKEN_KEY, null); var e = new Error('login'); e.needLogin = true; throw e; }
        if (!res.ok) throw new Error('Googleドライブとの通信に失敗しました（' + res.status + '）。しばらくしてからもう一度お試しください');
        return res;
      });
    }

    function findFile() {
      var q = encodeURIComponent("name='" + opts.fileName + "' and trashed=false");
      return api(API + '?spaces=appDataFolder&fields=files(id,modifiedTime)&q=' + q).then(function (r) { return r.json(); })
        .then(function (j) { return j.files && j.files[0] ? j.files[0].id : ''; });
    }
    function download(id) {
      return api(API + '/' + encodeURIComponent(id) + '?alt=media').then(function (r) { return r.text(); })
        .then(function (t) { return t ? JSON.parse(t) : null; });
    }
    function createFile(content) {
      var boundary = 'taskaremind' + Date.now();
      var body = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify({ name: opts.fileName, parents: ['appDataFolder'], mimeType: 'application/json' }) +
        '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + content + '\r\n--' + boundary + '--';
      return api(UPLOAD + '?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: body })
        .then(function (r) { return r.json(); }).then(function (j) { return j.id; });
    }
    function updateFile(id, content) {
      return api(UPLOAD + '/' + encodeURIComponent(id) + '?uploadType=media&fields=id', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: content });
    }
    function fetchEmail() {
      return api('https://www.googleapis.com/oauth2/v3/userinfo').then(function (r) { return r.json(); })
        .then(function (j) { meta.email = j.email || meta.email; saveMeta(); }).catch(function () { /* 表示できなくても同期はできる */ });
    }

    /** 取得 → 結合 → 保存 */
    function syncNow() {
      if (!meta.enabled) return Promise.resolve(false);
      if (!tokenValid()) { set('needLogin'); return Promise.resolve(false); }
      if (st.syncing) { st.again = true; return Promise.resolve(false); }
      st.syncing = true;
      set('syncing');
      var remoteCols = null;
      return (meta.fileId ? Promise.resolve(meta.fileId) : findFile()).then(function (id) {
        meta.fileId = id;
        return id ? download(id).catch(function (e) {
          if (e.needLogin) throw e;
          meta.fileId = ''; return null; // ファイルが消されていたら作り直す
        }) : null;
      }).then(function (remote) {
        var applied = Promise.resolve();
        remoteCols = {};
        opts.collections.forEach(function (c) { remoteCols[c] = []; });
        if (remote) {
          var data = Logic.migrate(remote);
          Object.keys(data.collections).forEach(function (c) { if (remoteCols[c]) remoteCols[c] = data.collections[c] || []; });
          var incoming = Logic.mergeImport(opts.getDb(), remoteCols);
          if (incoming.length) applied = opts.applyRemote(incoming);
        }
        return applied;
      }).then(function () {
        // 端末の方が新しい記録（またはドライブにない記録）があれば、ドライブを更新する
        var outgoing = Logic.mergeImport(remoteCols, opts.getDb());
        if (meta.fileId && !outgoing.length) return;
        var content = JSON.stringify(Logic.makeExport(opts.getDb(), opts.meta || {}));
        return meta.fileId ? updateFile(meta.fileId, content) : createFile(content).then(function (id) { meta.fileId = id; });
      }).then(function () {
        meta.lastSyncAt = new Date().toISOString();
        saveMeta();
        st.syncing = false;
        set('idle');
        if (st.again) { st.again = false; return syncNow(); }
        return true;
      }).catch(function (e) {
        st.syncing = false;
        st.again = false;
        saveMeta();
        if (e && e.needLogin) set('needLogin'); else set('error', (e && e.message) || String(e));
        return false;
      });
    }

    return {
      available: function () { return !!opts.clientId; },
      enabled: function () { return !!meta.enabled; },
      state: function () { return st.state; },
      error: function () { return st.error; },
      email: function () { return meta.email; },
      lastSyncAt: function () { return meta.lastSyncAt; },
      tokenValid: tokenValid,
      /** 最初の設定（ボタンを押したときに呼ぶ） */
      start: function () {
        set('syncing');
        return requestToken('consent').then(function () {
          meta.enabled = true; meta.fileId = ''; saveMeta();
          return fetchEmail();
        }).then(syncNow).catch(function (e) { set(meta.enabled ? 'needLogin' : 'off'); throw e; });
      },
      /** ログインが切れたあとに、もう一度つなぐ（ボタンを押したときに呼ぶ） */
      resume: function () {
        return requestToken('').then(syncNow).catch(function (e) { set('needLogin', e.message); throw e; });
      },
      syncNow: syncNow,
      /** 保存のたびに呼ぶ。少し待ってまとめて同期する */
      schedule: function () {
        if (!meta.enabled) return;
        if (!tokenValid()) { if (st.state !== 'needLogin') set('needLogin'); return; }
        clearTimeout(timer);
        timer = setTimeout(syncNow, 1500);
      },
      /** 同期をやめる（端末のデータは残る） */
      stop: function (alsoDeleteRemote) {
        var p = Promise.resolve();
        if (alsoDeleteRemote && tokenValid() && meta.fileId) {
          p = api(API + '/' + encodeURIComponent(meta.fileId), { method: 'DELETE' }).catch(function () { /* 消せなくても同期は止める */ });
        }
        return p.then(function () {
          if (tok && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            try { google.accounts.oauth2.revoke(tok.access_token, function () {}); } catch (e) { /* 無視 */ }
          }
          tok = null; writeJson(sessionStorage, TOKEN_KEY, null);
          meta = { enabled: false, fileId: '', lastSyncAt: '', email: '' }; saveMeta();
          set('off');
        });
      }
    };
  }

  return { create: create };
})();
