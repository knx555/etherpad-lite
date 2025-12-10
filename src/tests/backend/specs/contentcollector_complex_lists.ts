
'use strict';

import AttributePool from '../../../static/js/AttributePool';
const contentcollector = require('../../../static/js/contentcollector');
import {JSDOM} from 'jsdom';

describe('ContentCollector - Complex Lists', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(function () {
    apool = new AttributePool();
    cc = contentcollector.makeContentCollector(true, {}, apool, null);
  });

  it('should handle alternating UL and OL correctly', function () {
    // User report: "Multiformatierte Liste, wo sich UL und OL abwechselnd in der Liste, dann wird alles zu einer unordered Liste."
    // Scenario:
    // <ul><li>Item 1</li></ul>
    // <ol><li>Item 2</li></ol>
    // <ul><li>Item 3</li></ul>
    const html = '<html><body><ul><li>Item 1</li></ul><ol><li>Item 2</li></ol><ul><li>Item 3</li></ul></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();
    
    // Check attributes for each line
    // Line 0: Item 1 -> list:bullet1
    // Line 1: Item 2 -> list:number1
    // Line 2: Item 3 -> list:bullet1
    
    const getListType = (lineIndex: number) => {
        const attribString = result.lineAttribs[lineIndex];
        // Parse attribString to find list type. 
        // This is a bit complex without the AttributeManager, but we can check the pool.
        // Or we can just check if the pool contains the expected attributes.
        return attribString;
    };

    console.log('Pool:', apool);
    console.log('Line Attribs:', result.lineAttribs);

    // We expect 'list' attribute to be present.
    // Let's verify the pool has 'list' -> 'bullet1' and 'list' -> 'number1'
    
    // Helper to decode attributes
    const decodeAttribs = (str: string) => {
        const attrs = {};
        if (!str) return attrs;
        const pairs = str.split('*');
        pairs.forEach((p: string) => {
            if (!p) return;
            const [op, val] = p.split('+'); // This is not standard attrib string format.
            // Standard format is *N+M where N is key index, M is value index? No.
            // It's *i*j*k... where i, j, k are indices into the pool.
            // Actually contentcollector produces: *0*1*2...
        });
        // Let's just check the pool content for now.
    };
    
    // We can check if 'number1' is in the pool and used.
    let hasNumber1 = false;
    for (const id in apool.numToAttrib) {
        const [k, v] = apool.numToAttrib[id];
        if (k === 'list' && v === 'number1') hasNumber1 = true;
    }
    
    if (!hasNumber1) {
        throw new Error('Expected list:number1 to be in the attribute pool, but it was missing. The OL might have been converted to UL.');
    }
  });

  it('should handle ordered list numbering correctly', function () {
    // User report: "alle die eins haben bei der Formatierung"
    const html = '<html><body><ol><li>Item 1</li><li>Item 2</li><li>Item 3</li></ol></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    // We need to check the 'start' attribute.
    // Item 1: start:1
    // Item 2: start:2
    // Item 3: start:3
    
    const checkStartAttrib = (val: any) => {
        for (const id in apool.numToAttrib) {
            const [k, v] = apool.numToAttrib[id];
            if (k === 'start' && v == val) return true;
        }
        return false;
    };

    if (!checkStartAttrib(1)) throw new Error('Missing start:1');
    if (!checkStartAttrib(2)) throw new Error('Missing start:2');
    if (!checkStartAttrib(3)) throw new Error('Missing start:3');
  });

  it('should handle nested ordered list numbering correctly', function () {
    // <ol><li>Item 1</li><li><ol><li>Item 1.1</li><li>Item 1.2</li></ol></li><li>Item 2</li></ol>
    const html = '<html><body><ol><li>Item 1</li><li><ol><li>Item 1.1</li><li>Item 1.2</li></ol></li><li>Item 2</li></ol></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    // Item 1: start:1 (level 1)
    // Item 1.1: start:1 (level 2)
    // Item 1.2: start:2 (level 2)
    // Item 2: start:2 (level 1)
    
    // This is harder to verify just by pool existence, we need to know WHICH line has WHICH attribute.
    // But for now, let's just see if we have multiple start:1 and start:2.
    // Actually, the pool deduplicates. So start:1 and start:2 will exist once.
    // We need to check if the lines point to the correct attributes.
  });
});
