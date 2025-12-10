
'use strict';

const contentcollector = require('../../../static/js/contentcollector');
const AttributePool = require('../../../static/js/AttributePool').default;
const {JSDOM} = require('jsdom');

describe('ContentCollector - Whitespace Handling', function () {
  let cc;
  let apool;

  beforeEach(function () {
    apool = new AttributePool();
    cc = contentcollector.makeContentCollector(true, {}, apool, null);
  });

  it('should ignore whitespace-only text nodes between block elements', function () {
    // <li>\n<p>Item</p>\n</li>
    const html = '<html><body><li>\n<p>Item</p>\n</li></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    console.log('Lines:', result.lines);
    // Expected: ["*Item"] (one line)
    // If bug exists: ["*", "*Item", "*"] (3 lines) or similar
    
    if (result.lines.length > 1) {
        // Check if lines are empty/whitespace
        const meaningfulLines = result.lines.filter(l => l.replace(/\*/g, '').trim().length > 0);
        if (result.lines.length > meaningfulLines.length) {
             throw new Error(`Found extra whitespace lines. Got ${result.lines.length} lines: ${JSON.stringify(result.lines)}`);
        }
    }
  });
});
