'use strict';

const SALARY_PATTERNS = [
  // $180,000 - $220,000
  {
    re: /\$\s*([\d,]+(?:\.\d+)?)\s*[-\u2013\u2014]+\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:per\s*year|\/year|\/yr|per\s*annum|annually)?/gi,
    fn: (m, lo, hi) => {
      const l = parseFloat(lo.replace(/,/g,'')), h = parseFloat(hi.replace(/,/g,''));
      return l > 10000 ? `$${fmt(l)} - $${fmt(h)} per year` : null;
    }
  },
  // $58.65/hour to $181,000/year
  {
    re: /\$\s*([\d,]+(?:\.\d+)?)\s*\/(?:hour|hr)\s+to\s+\$\s*([\d,]+(?:\.\d+)?)/gi,
    fn: (m, lo, hi) => `$${lo}/hour to $${fmt(parseFloat(hi.replace(/,/g,'')))} per year`
  },
  // 12 LPA / CTC: 15 LPA
  {
    re: /(\d+(?:\.\d+)?)\s*(?:[-\u2013]\s*(\d+(?:\.\d+)?)\s*)?lpa/gi,
    fn: (m, lo, hi) => hi ? `${lo} - ${hi} LPA` : `${lo} LPA`
  },
  // Rs./₹ amount per annum
  {
    re: /[₹Rs]+\.?\s*([\d,]+(?:\.\d+)?)\s*(?:per\s*annum|per\s*year|\/year|pa\b)/gi,
    fn: (m, amt) => `₹${amt} per annum`
  },
  // 75,500 - 131,200 USD
  {
    re: /([\d,]+)\s*[-\u2013\u2014]\s*([\d,]+)\s*USD/gi,
    fn: (m, lo, hi) => {
      const l = parseFloat(lo.replace(/,/g,'')), h = parseFloat(hi.replace(/,/g,''));
      return l > 10000 ? `$${fmt(l)} - $${fmt(h)} USD` : null;
    }
  },
  // base compensation range: 61087 - 104364
  {
    re: /base\s+compensation\s+range[^:]*:\s*([\d,]+)\s*[-\u2013]\s*([\d,]+)/gi,
    fn: (m, lo, hi) => `$${fmt(parseFloat(lo.replace(/,/g,'')))} - $${fmt(parseFloat(hi.replace(/,/g,'')))}`
  },
  // pay range ... $120,000 - $145,000
  {
    re: /pay\s+range[^$]*\$\s*([\d,]+)\s*[-\u2013]\s*\$?\s*([\d,]+)/gi,
    fn: (m, lo, hi) => `$${fmt(parseFloat(lo.replace(/,/g,'')))} - $${fmt(parseFloat(hi.replace(/,/g,'')))}`
  }
];

function fmt(n) { return n.toLocaleString('en-US'); }

function extractSalary(text) {
  if (!text) return null;
  const t = text.replace(/\s+/g, ' ');
  for (const { re, fn } of SALARY_PATTERNS) {
    re.lastIndex = 0;
    const m = re.exec(t);
    if (m) {
      try { const r = fn(...m); if (r) return r.trim(); } catch(_) {}
    }
  }
  return null;
}

function extractAllSalaries(text) {
  if (!text) return [];
  const t = text.replace(/\s+/g, ' ');
  const results = [];
  for (const { re, fn } of SALARY_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t)) !== null) {
      try {
        const r = fn(...m);
        if (r && !results.includes(r.trim())) results.push(r.trim());
      } catch(_) {}
    }
  }
  return results;
}

module.exports = { extractSalary, extractAllSalaries };
