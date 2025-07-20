import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
   replaceCurrency
  ,loadAndReplaceCurrency
} from './oroconverter.js'; // Adjust path as needed

describe('replaceCurrency function', () => {
  const exchangeRates = {
    USD: 1.00,
    BRL: 5.42,
    EUR: 0.85,
    GBP: 0.73
  };

  describe('Basic currency replacement', () => {
    it('should replace USD symbol with BRL equivalent', () => {
      const input = 'The product costs $10.00';
      const expected = 'The product costs R$ 54,20';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should replace BRL symbol with USD equivalent', () => {
      const input = 'O produto custa R$ 54,20';
      const expected = 'O produto custa $ 10,00';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle multiple currencies in the same text', () => {
      const input = 'USD costs $100.00 and BRL costs R$ 542,00';
      const expected = 'USD costs R$ 542,00 and BRL costs R$ 542,00';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Different currency formats', () => {
    it('should handle currency code without space - BRL10,10', () => {
      const input = 'Price is BRL10,10';
      const expected = 'Price is $ 1,86';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle currency symbol with space - R$ 10.10', () => {
      const input = 'Price is R$ 10,10';
      const expected = 'Price is $ 1,86';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle amount followed by symbol - 10.10 R$', () => {
      const input = 'Price is 10,10 R$';
      const expected = 'Price is $ 1,86';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle currency code with space - BRL 1.000,10', () => {
      const input = 'Price is BRL 1.000,10';
      const expected = 'Price is $ 184,52';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle USD format with comma separators - USD 1,234.56', () => {
      const input = 'Price is USD 1.234,56';
      const expected = 'Price is R$ 6.691,32';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle EUR symbol format - €999.99', () => {
      const input = 'Price is €999.99';
      const expected = 'Price is R$ 6.376,41';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Number formatting preservation', () => {
    it('should preserve Brazilian number format when converting to BRL', () => {
      const input = 'Price is $1,234.56';
      const expected = 'Price is R$ 6.691,32';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should preserve US number format when converting to USD', () => {
      const input = 'Price is R$ 6.691,32';
      const expected = 'Price is $ 1.234,56';
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle decimal places correctly', () => {
      const input = 'Price is $0.99';
      const expected = 'Price is R$ 5,37';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Edge cases', () => {
    it('should handle text with no currency values', () => {
      const input = 'This text has no currency values';
      const expected = 'This text has no currency values';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle empty string', () => {
      const input = '';
      const expected = '';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle zero values', () => {
      const input = 'Price is $0.00';
      const expected = 'Price is R$ 0,00';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle very large numbers', () => {
      const input = 'Price is $1,000,000.00';
      const expected = 'Price is R$ 5.420.000,00';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle fractional cents', () => {
      const input = 'Price is $1.235';
      const expected = 'Price is R$ 6.693,70';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Multiple currencies in complex text', () => {
    it('should handle mixed currency formats in same text', () => {
      const input = 'Products: USD 100.00, BRL500,00, €50.00, and £25.00';
      const expected = 'Products: R$ 542,00, BRL500,00, R$ 318,82, and R$ 185,62';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle currencies at different positions', () => {
      const input = 'Start $10.00 middle R$ 54,20 end €8.50';
      const expected = 'Start R$ 54,20 middle R$ 54,20 end R$ 54,20';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should preserve text structure with multiple replacements', () => {
      const input = 'Item A: $10.00\nItem B: R$ 20,00\nItem C: €15.00';
      const expected = 'Item A: R$ 54,20\nItem B: R$ 20,00\nItem C: R$ 95,65';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Currency code variations', () => {
    it('should handle lowercase currency codes', () => {
      const input = 'Price is usd 10.00';
      const expected = 'Price is R$ 54,20';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle currency symbols with different spacing', () => {
      const input = 'Prices: $10.00, $ 20.00, $  30.00';
      const expected = 'Prices: R$ 54,20, R$ 108,40, R$ 162,60';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Error handling', () => {
    it('should handle unknown currency codes gracefully', () => {
      const input = 'Price is XYZ 10.00';
      const expected = 'Price is XYZ 10.00'; // Should remain unchanged
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle missing exchange rate for target currency', () => {
      const input = 'Price is $10.00';
      const expected = 'Price is $10.00'; // Should remain unchanged
      const result = replaceCurrency(input, exchangeRates, 'JPY', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle missing exchange rate for source currency', () => {
      const input = 'Price is ¥1000';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      // Should either throw error or leave unchanged
      assert.ok(result === input || result.includes('R$'));
    });
  });

  describe('Precision and rounding', () => {
    it('should round to 2 decimal places', () => {
      const input = 'Price is $1.111';
      const expected = 'Price is R$ 6.021,62';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should handle very small amounts', () => {
      const input = 'Price is $0.01';
      const expected = 'Price is R$ 0,05';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('Format preservation', () => {
    it('should maintain original format structure', () => {
      const input = 'BRL1000,00';
      const expected = '$ 184,50'; // Should maintain no-space format
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('should maintain spacing in currency code formats', () => {
      const input = 'BRL 1000,00';
      const expected = '$ 184,50'; // Should maintain space format
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR");
      assert.strictEqual(result, expected);
    });
  });

  describe('skipping currency', () => {
    it('should maintain original format structure', () => {
      const input = 'BRL1000,00, USD1000,00, EUR 100,00, GBP 100';
      const expected = '$ 184,50, USD1000,00, EUR 100,00, $ 136,99'; 
      const result = replaceCurrency(input, exchangeRates, 'USD', "pt-BR", "EUR");
      assert.strictEqual(result, expected);
    });

    it('should maintain spacing in currency code formats', () => {
      const input = '<div><div><b>R$</b><i>100</i> </div><b>$</b><i>100</i></div></div>';
      const expected = '<div><div><b>R$</b><i>100</i> </div><b>€</b><i>85,00</i></div></div>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR", "BRL");
      assert.strictEqual(result, expected);
    });
  });



  describe('ReplaceCurrency with HTML', () => {

    it('should handle currency on texts as usual', () => {
      const input = '<div>$<span>R$</span><span>$199,99</span></div>';
      const expected = '<div>$<span>R$</span><span>R$ 1.083,95</span></div>';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    // HTML original (exemplo MercadoLivre)
    it('should handle currency on more complexes HTML', () => {
      const input = `
      <div class="andes-money-amount-combo">
          <span class="andes-money-amount__currency-symbol">R$</span>
          <span class="andes-money-amount__fraction">128,99</span>
      </div>
      `;
      const expected = '\n      <div class="andes-money-amount-combo">\n          <span class="andes-money-amount__currency-symbol">€</span>\n          <span class="andes-money-amount__fraction">20,23</span>\n      </div>\n      ';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('Adjacent tags without space', () => {
      const input = '<span>R$</span><span>199,99</span>';
      const expected =  '<span>€</span><span>31,36</span>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('Adjacent tags with space', () => {
      const input = '<span>$</span> <span>1.299,50</span>';
      const expected =  '<span>€</span> <span>1.104,58</span>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('Tags with different classes', () => {
      const input = '<span class="moeda">$</span><span class="valor">2.500,00</span>';
      const expected =  '<span class="moeda">R$</span><span class="valor">13.550,00</span>';
      const result = replaceCurrency(input, exchangeRates, 'BRL', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('HTML ANNELED COMPLEX', () => {
      const input = '<div><span>$</span></div><div><span>100</span></div>';
      const expected =  '<div><span>€</span></div><div><span>85,00</span></div>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });

    it('HTML SEVERAL', () => {
      const input = `<div>
        <div><span>$</span></div><div><span>100</span></div>
        <div><span>BRL</span></div><div><span>50</span></div>
        <div>USD 50</div>
      </div>`;
      const expected =  '<div>\n        <div><span>€</span></div><div><span>85,00</span></div>\n        <div><span>€</span></div><div><span>7,84</span></div>\n        <div>€ 42,50</div>\n      </div>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });


    it('HTML leave attributes alone', () => {
      const input = `<div>
        <div id="$100,00"><span>$</span></div><div><span>100</span></div>
        <div><span>BRL</span id="USD 100,00"></div><div><span>50</span></div>
        <div src="nonno$1nono">USD 50</div>
      </div>`;
      const expected = '<div>\n        <div id="$100,00"><span>€</span></div><div><span>85,00</span></div>\n        <div><span>€</span id="USD 100,00"></div><div><span>7,84</span></div>\n        <div src="nonno$1nono">€ 42,50</div>\n      </div>';
      const result = replaceCurrency(input, exchangeRates, 'EUR', "pt-BR");
      assert.strictEqual(result, expected);
    });


  });



});


describe('loadAndReplaceCurrency function', () => {

  describe('Basic currency replacement', () => {
    it('should replace USD symbol with ORO equivalent', async () => {
      const now = new Date();
      const input = 'The product costs $10.00';
      const result = await loadAndReplaceCurrency(input, 'ORO', "pt-BR");
      assert.strictEqual(result.indexOf("¤") !== -1, true);
      const later = new Date();
      assert.strictEqual((later - now) > 100, true); // loading rates
    });

    it('should handle multiple currencies in the same text', async () => {
      const now = new Date();
      const input = 'USD costs $100.00 and BRL costs R$ 542,00';
      const expected = 'USD costs R$ 542,00 and BRL costs R$ 542,00';
      const result = await loadAndReplaceCurrency(input, 'BRL', "pt-BR");
      assert.strictEqual(result.split("R$").length, 3);
      const later = new Date();
      assert.strictEqual((later - now) < 10, true); // cached rates
    });
  });

});
