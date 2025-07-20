// URL for fetching rates JSON
const RATE_URL = 'https://firebasestorage.googleapis.com/v0/b/oroindex/o/ORO_indexes_min.json?alt=media';

// Default ORO rate object
let ORO_rate = {
  name: 'Global',
  curr: 'ORO',
  price: 1.00,
  type: 'Coin'
};

/**
 * Fetches a JSON resource from the given URL.
 * @param {string} url – The URL to load JSON from.
 * @returns {Promise<any>} – Resolves with parsed JSON data.
 */
async function loadJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading JSON:', error);
    throw error;
  }
}

// Mapping currency ISO codes to symbols
const CurrencyMap = {
  USD: '$',
  BRL: 'R$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'Fr',
  CNY: '¥',
  INR: '₹',
  KRW: '₩',
  MXN: 'MX$',
  RUB: '₽',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  HRK: 'kn',
  TRY: '₺',
  ILS: '₪',
  AED: 'د.إ',
  SAR: 'ر.س',
  THB: '฿',
  SGD: 'S$',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  TWD: 'NT$',
  HKD: 'HK$',
  ZAR: 'R',
  EGP: 'E£',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  MAD: 'د.م.',
  TND: 'د.ت',
  XOF: 'CFA',
  XAF: 'FCFA',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$U',
  BOB: 'Bs',
  PYG: '₲',
  ARS: '$',
  VEF: 'Bs.F',
  BYN: 'Br',
  UAH: '₴',
  KZT: '₸',
  UZS: 'лв',
  GEL: '₾',
  AMD: '֏',
  AZN: '₼',
  MDL: 'lei',
  ALL: 'L',
  MKD: 'ден',
  RSD: 'дин',
  BAM: 'KM',
  ISK: 'kr',
  ORO: '¤'
};

// Reverse map: symbol → ISO code
const SymbolMap = Object.fromEntries(
  Object.entries(CurrencyMap).map(([code, symbol]) => [symbol, code])
);
// Resolve overlaps with priority
SymbolMap['$']   = 'USD';
SymbolMap['kr']  = 'SEK';
SymbolMap['Íkr'] = 'ISK';
SymbolMap['lei'] = 'RON';
SymbolMap['leu'] = 'RON';

// Prepare sorted, escaped list of all currency symbols
let currencySymbols = Object.keys(SymbolMap);
currencySymbols.sort((a, b) => b.length - a.length);
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
currencySymbols = currencySymbols.map(escapeRegExp);

// Build regex parts
const regSymbols = `(${currencySymbols.join('|')}+)`;
const regValue   = `([0-9]+(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)`;
const regISO     = `(${Object.keys(CurrencyMap).join('|')})`;
const regCurr    = `(${currencySymbols.join('|')}|${Object.keys(CurrencyMap).join('|')}+)`;

// Regex patterns for inline currency detection
const currencyPatterns = [
  // e.g. "$1,234.56" or "USD 1,234.56"
  // new RegExp(`${regCurr}\\s?\\s*${regValue}`, 'ig'),
  new RegExp(`(?<![<="'])${regCurr}\\s?\\s*${regValue}`, 'ig'),
  // e.g. "1,234.56 USD" or "1.234,56€"
  // new RegExp(`${regValue}\\s?\\s*${regCurr}`, 'ig')
  new RegExp(`(?<![<="'])${regValue}\\s?\\s*${regCurr}`, 'ig')
];


// Regex for HTML-wrapped currency/value pairs
const regexHTML = new RegExp(
  `(<[^>]+>\\s*)${regCurr}` +               // opening tag + currency
  `(\\s*<\\/[^>]+>[\\s\\S]*?<[^>]+>\\s*)` + // close currency tag + inner HTML
  `${regValue}` +                          // numeric value
  `(\\s*<\\/[^>]+>)`,                      // closing value tag
  'gim'
);

const regAttr = /(?<=<[\w:-]+(?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))*?)\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+)/gi;

// RegExp to strip thousand separators
const regexThousands = /(?<=\d)([.,])(?=\d{3}(\D|$))/g;

/**
 * Cleans a numeric string: removes thousand separators, normalizes decimal.
 * @param {string} str
 * @returns {string}
 */
function clearNumber(str) {
  // Remove thousand separators
  str = str.replace(regexThousands, '');
  // Convert comma decimal to dot
  return str.replace(/,(\d{2})$/, '.$1');
}

/**
 * Formats a numeric or numeric-string value into localized currency format.
 * @param {number|string} value – The input value.
 * @param {boolean} returnNumeric – If true, returns raw number; otherwise formatted string.
 * @param {string} locale – BCP 47 locale identifier (e.g. 'en-US', 'pt-BR').
 * @returns {number|string}
 */
const formatCurrency = (value, returnNumeric, locale) => {
  const decimals = 2;
  let str = typeof value === 'number' ? value.toFixed(decimals) : String(value);
  // Remove non-digit and non-separator chars
  let justNums = clearNumber(str.replace(/[^\d.,]/g, ''));
  // Ensure enough digits
  while (justNums.length <= decimals) {
    justNums = '0' + justNums;
  }
  const num = parseFloat(justNums);
  if (returnNumeric) return num;
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Converts an amount from one currency to another using provided rates.
 * @param {string} inputCurr – ISO code or symbol of the source currency.
 * @param {string} inputVal – Numeric string or symbol-prefixed value.
 * @param {Object} rates – Map of ISO code → rate relative to ORO.
 * @param {string} targetCurr – ISO code or symbol of target currency.
 * @param {string} locale – Locale for formatting output.
 * @returns {{curr: string, val: string, factor: number, toCurr: string, newVal: string}}
 */
const calculateExchange = (inputCurr, inputVal, rates, targetCurr, locale, skipCurrency) => {
  const rateTo = rates[targetCurr] ?? rates[SymbolMap[targetCurr]] ?? 1;
  let codeTo = CurrencyMap[targetCurr] || targetCurr;
  codeTo = String(codeTo).toUpperCase();
  inputCurr = String(inputCurr).toUpperCase();
  // Determine which part is currency vs. value
  const isCurrFirst = Boolean(CurrencyMap[inputCurr] || SymbolMap[inputCurr]);
  let curr = isCurrFirst ? inputCurr.trim() : inputVal.trim();
  curr = SymbolMap[curr] || curr;
  let val  = (isCurrFirst ? inputVal : inputCurr).trim();
  if (curr === skipCurrency) return {newVal: val, curr: curr }
  const rateFrom = rates[curr];
  const factor   = rateTo / rateFrom;
  let converted = formatCurrency(val, true, locale) * factor;
  /*if (locale) */converted = formatCurrency(converted, false, locale);
  return { curr, val, factor, toCurr: targetCurr, newVal: converted, currSymbol: codeTo };
};

/**
 * Replaces all currency occurrences in `text` with converted target currency.
 * @param {string} text
 * @param {Object} rates
 * @param {string} toCurr
 * @param {string} locale
 * @returns {string}
 */
const replaceCurrencyInText = (text, rates, toCurr, locale, skipCurrency) => {
  if (typeof rates !== 'object' || !text) return text;
  toCurr = SymbolMap[toCurr] || toCurr;
  const targetSymbol = CurrencyMap[toCurr] || toCurr;
  let placeholders = [];
  const rate = rates[toCurr];
  if (!rate) return text;
  if (!text) return text;
  // Escape attributes
  text = text.replace(regAttr, (_, tag, attr) => {
    if (!attr.trim()) return _;
    placeholders.push(`${_}`);
    return ` __${placeholders.length - 1}__ `;
  });
  // Inline patterns
  currencyPatterns.forEach(pattern => {
    text = text.replace(pattern, (match, currSym, numeric) => {
      const { newVal, curr } = calculateExchange(currSym, numeric, rates, toCurr, locale, skipCurrency);
      if (toCurr === curr || curr === skipCurrency) {
        return match;
      };
      placeholders.push(`${targetSymbol} ${newVal}`);
      return ` __${placeholders.length - 1}__ `;
    });
  });
  // HTML-wrapped patterns
  text = text.replace(regexHTML, (_, openTag, currSym, innerHTML, numeric, closeTag) => {
    const { newVal, curr } = calculateExchange(currSym, numeric, rates, toCurr, locale, skipCurrency);
      if (toCurr === curr || curr === skipCurrency) {
      return _;
    };
    const replacement = `${openTag}${targetSymbol}${innerHTML}${newVal}${closeTag}`;
    placeholders.push(replacement);
    return ` __${placeholders.length - 1}__ `;
  });
  // Restore placeholders
  placeholders = placeholders.map(placeholder => {
    return placeholder.replace(/ __(\d+)__ /g, (_, idx) => placeholders[Number(idx)])
  });
  text = text.replace(/ __(\d+)__ /g, (_, idx) => placeholders[Number(idx)])
  return text;
};

// In-memory rate cache
let rateData = { loading: true };

/**
 * Loads rates from remote and caches them.
 * @returns {Promise<Object>}
 */
const loadRates = async () => {
  const data = await loadJSON(RATE_URL);
  data.ORO = 1;
  data.loading = false;
  rateData = data;
  return rateData;
};

/**
 * Ensures rates are loaded, then replaces currencies in text.
 * @param {string} text
 * @param {string} targetCurrency
 * @param {string} locale
 * @returns {Promise<string>}
 */
const loadAndReplaceCurrency = async (text, targetCurrency, locale, skipCurrency) => {
  if (!rateData.ORO) {
    await loadRates();
  }
  return replaceCurrencyInText(text, rateData, targetCurrency, locale, skipCurrency);
};


module.exports = {
  loadAndReplaceCurrency,
  replaceCurrency: replaceCurrencyInText,
  formatCurrency
};


