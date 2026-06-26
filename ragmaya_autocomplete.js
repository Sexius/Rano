/**
 * 자동완성(추천 검색어) 공용 컴포넌트
 * 사용법: initAutocomplete('#inputId', '/api/autocomplete/item', { onSelect: fn })
 *
 * v5 (2026-06-20): 클라이언트 사이드 인덱스 + 아이템 아이콘.
 *   - /static/search/manifest.json → items-<hash>.json 을 1회 로드해
 *     브라우저 메모리에서 즉시 검색(네트워크 0회). 타이핑 즉답.
 *   - 인덱스 미로드/로컬 0건이면 서버(/api/autocomplete/*)로 폴백
 *     → 인덱스에 아직 없는 신규 아이템도 항상 검색됨(하이브리드).
 *   - 드롭다운에 /item_icon/{id} 아이콘 표시.
 *   - 의상 모드(apiUrl 에 '/costume') 는 '의상' 포함 아이템만 로컬 필터.
 */
(function () {
  // ── basePath 감지 (스크립트 자기 src 기준) ──────────────────────────
  // v2에선 /v2/static/autocomplete.js 로 로드됨 → _BP='/v2'. 순수 v1에선 ''.
  // 아이콘 <img src> 는 fetch 가 아니라 layout 의 fetch-shim 이 못 고치므로
  // 여기서 직접 basePath 를 붙여야 v2 아이콘 라우트(/v2/item_icon)로 간다.
  var _BP = '';
  try {
    var _cs = document.currentScript;
    var _src = (_cs && _cs.src) ? _cs.src : '';
    var _m = _src.match(/^(?:https?:\/\/[^/]+)?(.*?)\/static\/autocomplete\.js/);
    if (_m && _m[1]) _BP = _m[1];
  } catch (e) { /* ignore */ }

  function _iconUrl(id) { return _BP + '/item_icon/' + id; }

  // ── 공유 아이템 인덱스 (전 인스턴스 + SPA 네비 공유, 1회 로드) ─────────
  // window.__rmItemIndex        : [{id, name, nsp}]  (nsp = 공백제거 소문자)
  // window.__rmItemIndexPromise : 로딩 Promise
  function _loadIndex() {
    var w = window;
    if (w.__rmItemIndexPromise) return w.__rmItemIndexPromise;
    w.__rmItemIndexPromise = fetch('/static/search/manifest.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('manifest'); return r.json(); })
      .then(function (man) {
        var url = (man && man.indexUrl) ? man.indexUrl : '/static/search/items.json';
        return fetch(url, { cache: 'force-cache' }); // 해시 파일명이라 영구 캐시 안전
      })
      .then(function (r) { if (!r.ok) throw new Error('index'); return r.json(); })
      .then(function (data) {
        var arr = (data && data.items) ? data.items : [];
        var out = new Array(arr.length);
        for (var i = 0; i < arr.length; i++) {
          var id = arr[i][0];
          var name = arr[i][1] || '';
          out[i] = { id: id, name: name, nsp: name.replace(/\s/g, '').toLowerCase() };
        }
        w.__rmItemIndex = out;
        return out;
      })
      .catch(function () {
        // 실패 시 인덱스 없음 처리 → 서버 폴백이 계속 동작. 다음에 재시도 가능.
        w.__rmItemIndex = null;
        w.__rmItemIndexPromise = null;
        return null;
      });
    return w.__rmItemIndexPromise;
  }

  // ── 로컬 검색 (서버 SQL 랭킹과 동일 규칙: prefix > 포함 > 공백무시, 짧은순) ──
  function _localSearch(index, query, limit, costumeOnly) {
    var q = (query || '').trim();
    if (!q) return [];
    var ql = q.toLowerCase();
    var qnsp = ql.replace(/\s/g, '');
    var res = [];
    for (var i = 0; i < index.length; i++) {
      var it = index[i];
      if (costumeOnly && it.name.indexOf('의상') === -1) continue;
      var nl = it.name.toLowerCase();
      var pos = nl.indexOf(ql);
      var rank;
      if (pos === 0) rank = 0;
      else if (pos !== -1) rank = 1;
      else if (qnsp && it.nsp.indexOf(qnsp) !== -1) rank = 2;
      else continue;
      res.push({ id: it.id, name: it.name, _r: rank, _l: it.name.length });
    }
    res.sort(function (a, b) { return (a._r - b._r) || (a._l - b._l); });
    return res.slice(0, limit);
  }

  // CSS 동적 주입 (1회)
  if (!document.getElementById('ac-style')) {
    const style = document.createElement('style');
    style.id = 'ac-style';
    style.textContent = `
      .ac-wrap { position: relative; display: inline-block; }
      .ac-list {
        position: absolute; left: 0; right: 0; top: 100%;
        z-index: 99999;
        background: #fff;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 10px 10px;
        max-height: 320px;
        overflow-y: auto;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        display: none;
      }
      .ac-list.show { display: block; }
      .ac-item {
        display: flex;
        align-items: center;
        padding: 7px 12px;
        cursor: pointer;
        font-size: 14px;
        color: #333;
        border-bottom: 1px solid #f2f2f2;
        transition: background .1s;
      }
      .ac-item:last-child { border-bottom: none; }
      .ac-item:hover, .ac-item.active {
        background: #f0f5e8;
      }
      .ac-icon {
        width: 24px; height: 24px;
        object-fit: contain;
        margin-right: 9px;
        flex: 0 0 auto;
        image-rendering: -webkit-optimize-contrast;
      }
      .ac-text { flex: 1 1 auto; min-width: 0; }
      .ac-item .ac-highlight {
        color: #e74c3c;
        font-weight: 700;
      }
      .ac-item .ac-sub {
        font-size: 12px;
        color: #999;
        margin-left: 6px;
      }
      /* 모바일 터치 최적화 */
      @media (max-width: 768px) {
        .ac-item { padding: 10px 12px; font-size: 15px; }
        .ac-icon { width: 26px; height: 26px; }
        .ac-list { max-height: 260px; }
      }
    `;
    document.head.appendChild(style);
  }

  let _activeAC = null; // 현재 열려있는 자동완성 (전역 1개만)

  /**
   * 자동완성 초기화
   * @param {string} inputSelector - CSS 선택자 (#searchInput 등)
   * @param {string} apiUrl - 폴백 API 엔드포인트 (/api/autocomplete/item 등)
   * @param {object} opts - 옵션
   *   onSelect(item, inputEl): 항목 선택 시 콜백
   *   minLength: 최소 입력 글자 수 (기본 1)
   *   debounceMs: 서버 폴백 디바운스 (기본 300)
   *   limit: 최대 표시 개수 (기본 30)
   *   formatItem(item, query): 항목 HTML 커스텀 (지정 시 아이콘 자동삽입 안 함)
   *   costumeOnly: 강제 의상 필터 (미지정 시 apiUrl 로 자동 판별)
   */
  window.initAutocomplete = function (inputSelector, apiUrl, opts) {
    opts = opts || {};
    const minLen = opts.minLength || 1;
    const debounceMs = opts.debounceMs || 300;
    const limit = opts.limit || 30;
    const costumeMode = (typeof opts.costumeOnly === 'boolean')
      ? opts.costumeOnly
      : /\/costume/.test(apiUrl || '');
    // 로컬 아이템 인덱스(window.__rmItemIndex)는 '아이템/코스튬' 자동완성에만 사용.
    // 몬스터 등 다른 엔드포인트(apiUrl)에서 인덱스를 쓰면 아이템이 떠버리므로 항상 서버 조회.
    const useItemIndex = costumeMode || /autocomplete\/item/.test(apiUrl || '');
    // ★몬스터 자동완성은 아이콘이 item_icon이 아니라 몬스터 스프라이트(divine mobs)여야 함.
    const monsterMode = /autocomplete\/monster/.test(apiUrl || '');
    function acIconSrc(id) {
      return monsterMode
        ? ('https://static.divine-pride.net/images/mobs/png/' + id + '.png')
        : _iconUrl(id);
    }

    const input = document.querySelector(inputSelector);
    if (!input) return;

    // 인덱스 미리 로드 시작 (한 번만, 전역 공유)
    _loadIndex();

    // input을 wrapper로 감싸기
    const wrapper = document.createElement('div');
    wrapper.className = 'ac-wrap';
    // input의 원래 width를 유지
    wrapper.style.width = input.offsetWidth ? input.offsetWidth + 'px' : '100%';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // 드롭다운 목록 생성
    const list = document.createElement('div');
    list.className = 'ac-list';
    wrapper.appendChild(list);

    let timer = null;
    let activeIdx = -1;
    let items = [];
    let abortCtrl = null;

    function highlightMatch(text, query) {
      if (!text || !query) return text || '';
      // 1차: 원본 매칭
      var idx = text.toLowerCase().indexOf(query.toLowerCase());
      if (idx !== -1) {
        return text.substring(0, idx) +
          '<span class="ac-highlight">' + text.substring(idx, idx + query.length) + '</span>' +
          text.substring(idx + query.length);
      }
      // 2차: 띄어쓰기 무시 매칭 — 각 쿼리 글자 위치를 찾아서 하이라이트
      var qChars = query.replace(/\s/g, '').toLowerCase().split('');
      var result = '';
      var qi = 0;
      for (var ti = 0; ti < text.length; ti++) {
        if (qi < qChars.length && text[ti].toLowerCase() === qChars[qi]) {
          result += '<span class="ac-highlight">' + text[ti] + '</span>';
          qi++;
        } else {
          result += text[ti];
        }
      }
      return qi === qChars.length ? result : text;
    }

    function escAttr(s) {
      return String(s == null ? '' : s).replace(/"/g, '&quot;');
    }

    function renderList(data, query) {
      items = data;
      activeIdx = -1;
      if (!data.length) {
        list.classList.remove('show');
        _activeAC = null;
        return;
      }
      list.innerHTML = data.map(function (item, i) {
        if (opts.formatItem) {
          return '<div class="ac-item" data-idx="' + i + '">' + opts.formatItem(item, query) + '</div>';
        }
        var inner = '';
        if (item.id) {
          inner += '<img class="ac-icon" src="' + escAttr(acIconSrc(item.id)) + '" alt="" loading="lazy" ' +
                   'onerror="this.style.visibility=\'hidden\'">';
        }
        var textHtml = highlightMatch(item.name, query);
        if (item.name_eng) {
          textHtml += '<span class="ac-sub">' + highlightMatch(item.name_eng, query) + '</span>';
        }
        inner += '<span class="ac-text">' + textHtml + '</span>';
        return '<div class="ac-item" data-idx="' + i + '">' + inner + '</div>';
      }).join('');
      list.classList.add('show');
      _activeAC = list;
    }

    function selectItem(idx) {
      if (idx < 0 || idx >= items.length) return;
      const item = items[idx];
      input.value = item.name;
      list.classList.remove('show');
      _activeAC = null;
      if (opts.onSelect) opts.onSelect(item, input);
    }

    function fetchSuggestions(query) {
      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      fetch(apiUrl + '?q=' + encodeURIComponent(query) + '&limit=' + limit, {
        signal: abortCtrl.signal
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (Array.isArray(data)) renderList(data, query);
        })
        .catch(function () { /* abort 등 무시 */ });
    }

    // 입력 이벤트 — 로컬 인덱스 우선(즉답), 미로드/0건이면 서버 폴백(디바운스)
    input.addEventListener('input', function () {
      clearTimeout(timer);
      const val = input.value.trim();
      if (val.length < minLen) {
        list.classList.remove('show');
        _activeAC = null;
        return;
      }
      var idx = useItemIndex ? window.__rmItemIndex : null;
      if (idx) {
        var local = _localSearch(idx, val, limit, costumeMode);
        if (local.length) {
          if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; } // 떠있던 서버요청 취소
          renderList(local, val);
          return;
        }
        // 로컬 0건 → 신규 아이템 가능성 → 서버 폴백
        timer = setTimeout(function () { fetchSuggestions(val); }, debounceMs);
      } else {
        // 인덱스 아직 로딩 전 → 서버(기존 동작)
        timer = setTimeout(function () { fetchSuggestions(val); }, debounceMs);
      }
    });

    // 키보드 네비게이션
    input.addEventListener('keydown', function (e) {
      // Enter 키는 리스트 표시 여부와 관계없이 항상 pending fetch를 취소
      if (e.key === 'Enter') {
        if (list.classList.contains('show') && activeIdx >= 0) {
          e.preventDefault();
          e.stopPropagation();
          selectItem(activeIdx);
        } else {
          clearTimeout(timer);
          if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
          list.classList.remove('show');
          items = [];
          activeIdx = -1;
          _activeAC = null;
        }
        return;
      }

      if (!list.classList.contains('show')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        updateActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        updateActive();
      } else if (e.key === 'Escape') {
        list.classList.remove('show');
        _activeAC = null;
      }
    });

    function updateActive() {
      var els = list.querySelectorAll('.ac-item');
      els.forEach(function (el, i) {
        el.classList.toggle('active', i === activeIdx);
      });
      if (els[activeIdx]) els[activeIdx].scrollIntoView({ block: 'nearest' });
    }

    // 한글 IME 조합 중 Enter 시 keydown에서 key="Process"로 들어오므로
    // keyup에서도 Enter를 처리하여 pending fetch를 확실히 취소
    input.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(timer);
        if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
        list.classList.remove('show');
        items = [];
        activeIdx = -1;
        _activeAC = null;
      }
    });

    // 클릭 선택
    list.addEventListener('click', function (e) {
      var el = e.target.closest('.ac-item');
      if (el) selectItem(parseInt(el.dataset.idx));
    });

    // 포커스 아웃 시 닫기
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) {
        list.classList.remove('show');
        if (_activeAC === list) _activeAC = null;
      }
    });

    // 포커스 시 값이 있으면 다시 표시
    input.addEventListener('focus', function () {
      if (items.length && input.value.trim().length >= minLen) {
        list.classList.add('show');
        _activeAC = list;
      }
    });

    // 외부에서 자동완성을 강제로 닫을 수 있도록 dismiss 함수 반환
    return {
      dismiss: function () {
        clearTimeout(timer);
        if (abortCtrl) { abortCtrl.abort(); abortCtrl = null; }
        list.classList.remove('show');
        items = [];
        activeIdx = -1;
        _activeAC = null;
      }
    };
  };
})();
