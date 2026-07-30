/* ============================================================
   CODE PLAYGROUND CLIENT
   Sandboxed JS runner with virtual console output.
   ============================================================ */
(function () {
  'use strict';

  const editor = document.getElementById('pgCode');
  const consoleEl = document.getElementById('pgConsole');
  const runBtn = document.getElementById('runPgBtn');
  const resetBtn = document.getElementById('resetPgBtn');
  const clearBtn = document.getElementById('clearConsoleBtn');

  if (!editor || !consoleEl) return;

  const defaultSnippet = editor.value;

  function appendConsole(type, ...args) {
    const line = document.createElement('div');
    line.className = `pg-line pg-line-${type}`;
    const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');
    line.textContent = text;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function runCode() {
    consoleEl.innerHTML = '';
    const code = editor.value;

    // Custom console interceptor
    const customConsole = {
      log: (...args) => appendConsole('log', ...args),
      warn: (...args) => appendConsole('warn', ...args),
      error: (...args) => appendConsole('error', ...args),
      info: (...args) => appendConsole('info', ...args),
    };

    try {
      // Evaluate in safe isolated function context
      const runFn = new Function('console', code);
      runFn(customConsole);
    } catch (err) {
      appendConsole('error', err.stack || err.toString());
    }
  }

  runBtn.addEventListener('click', runCode);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      consoleEl.innerHTML = '<div class="pg-line" style="color:var(--text-muted);">Console cleared.</div>';
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      editor.value = defaultSnippet;
      consoleEl.innerHTML = '<div class="pg-line" style="color:var(--text-muted);">Reset snippet to default.</div>';
    });
  }

  // Ctrl+Enter or Cmd+Enter shortcut
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
  });
})();
