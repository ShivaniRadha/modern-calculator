// Calculator logic with keyboard support and simple safety checks
(() => {
  const displayEl = document.getElementById('display');
  const keys = document.querySelector('.keys');

  // state
  let current = '0';       // current displayed number or expression fragment
  let previous = '';       // previously stored expression (if needed)
  let lastKey = '';        // last key pressed

  const setDisplay = (v) => {
    displayEl.textContent = v;
  };

  const safeEval = (expr) => {
    // only allow digits, operators, parentheses, decimal and spaces
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) throw new Error('Invalid expression');
    // avoid dangerous sequences like multiple consecutive operators except - (handled below)
    // Evaluate using Function to keep eval-like behavior but still check chars above
    // Convert division symbol if any (not needed here)
    // Limit length to avoid heavy computations
    if (expr.length > 200) throw new Error('Expression too long');
    // Replace sequences like "++" or "--" with single operator is left for JS eval (JS handles some)
    // Evaluate
    // eslint-disable-next-line no-new-func
    return Function(`'use strict'; return (${expr})`)();
  };

  const appendChar = (ch) => {
    if (current === '0' && ch !== '.') current = ch;
    else current = current + ch;
    setDisplay(current);
  };

  const pressNumber = (num) => {
    if (lastKey === '=') { current = String(num); lastKey = ''; }
    else if (current === '0') current = String(num);
    else current += String(num);
    setDisplay(current);
  };

  const pressDot = () => {
    // prevent multiple dots in the last number segment
    const parts = current.split(/[\+\-\*\/\s]/);
    const last = parts[parts.length - 1];
    if (!last.includes('.')) {
      current += '.';
    }
    setDisplay(current);
  };

  const pressOperator = (op) => {
    if (lastKey === 'op') {
      // replace last operator (except allow negative sign)
      current = current.slice(0, -1) + op;
    } else if (lastKey === '=') {
      // start new expression using last result
      lastKey = '';
    } else {
      current += op;
    }
    setDisplay(current);
    lastKey = 'op';
  };

  const doClear = () => {
    current = '0';
    previous = '';
    lastKey = '';
    setDisplay(current);
  };

  const doDelete = () => {
    if (lastKey === '=') { current = '0'; lastKey = ''; setDisplay(current); return; }
    current = current.slice(0, -1) || '0';
    setDisplay(current);
  };

  const toggleSign = () => {
    // toggle sign of the last number segment
    const regex = /(-?\d*\.?\d+)(?!.*\d)/; // last number
    const match = current.match(regex);
    if (!match) return;
    const num = match[0];
    const start = match.index;
    const toggled = (Number(num) * -1).toString();
    current = current.slice(0, start) + toggled;
    setDisplay(current);
  };

  const pressPercent = () => {
    // convert last number to percentage of itself (e.g., 50% -> 0.5)
    const regex = /(-?\d*\.?\d+)(?!.*\d)/;
    const match = current.match(regex);
    if (!match) return;
    const num = Number(match[0]);
    const start = match.index;
    const replaced = String(num / 100);
    current = current.slice(0, start) + replaced;
    setDisplay(current);
  };

  const calculate = () => {
    try {
      // sanitize typical user characters
      const expr = current.replace(/÷/g, '/').replace(/×/g, '*');
      // if last char is operator, drop it
      if (/[+\-*/]$/.test(expr)) {
        setDisplay('Error');
        return;
      }
      const result = safeEval(expr);
      const displayResult = (Number.isFinite(result) ? String(result) : 'Error');
      current = displayResult;
      setDisplay(displayResult);
      lastKey = '=';
    } catch (e) {
      setDisplay('Error');
      current = '0';
    }
  };

  // button clicks
  keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;

    if (!isNaN(action)) { // number
      pressNumber(action);
      lastKey = 'num';
      return;
    }

    switch (action) {
      case '.': pressDot(); lastKey = 'num'; break;
      case '+': case '-': case '*': case '/':
        pressOperator(action); break;
      case 'clear': doClear(); break;
      case 'delete': doDelete(); break;
      case 'toggle': toggleSign(); break;
      case 'percent': pressPercent(); break;
      case '=': calculate(); break;
      default: break;
    }
  });

  // keyboard support
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if ((k >= '0' && k <= '9')) { pressNumber(k); lastKey = 'num'; e.preventDefault(); return; }
    if (k === '.') { pressDot(); lastKey = 'num'; e.preventDefault(); return; }
    if (k === '+' || k === '-' || k === '*' || k === '/') { pressOperator(k); e.preventDefault(); return; }
    if (k === 'Enter' || k === '=') { calculate(); e.preventDefault(); return; }
    if (k === 'Backspace') { doDelete(); e.preventDefault(); return; }
    if (k === 'Escape') { doClear(); e.preventDefault(); return; }
    if (k === '%') { pressPercent(); e.preventDefault(); return; }
  });

  // initialize
  setDisplay(current);
})();
