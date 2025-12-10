
'use strict';

const contentcollector = require('../../../static/js/contentcollector');
const AttributePool = require('../../../static/js/AttributePool').default;
const {JSDOM} = require('jsdom');

describe('ContentCollector - Orphaned LI Extra Lines', function () {
  let cc: any;
  let apool;

  beforeEach(function () {
    apool = new AttributePool();
    cc = contentcollector.makeContentCollector(true, {}, apool, null);
  });

  it('should not add extra lines for orphaned LI elements containing text', function () {
    const html = '<html><body><li>Item 1</li><li>Item 2</li></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    // We expect:
    // Line 1: "Item 1"
    // Line 2: "Item 2"
    
    console.log('Lines:', result.lines);
    if (result.lines.length > 2) {
        throw new Error(`Expected 2 lines, got ${result.lines.length}: ${JSON.stringify(result.lines)}`);
    }
  });

  it('should not add extra lines for orphaned LI elements containing P tags', function () {
    const html = '<html><body><li><p>Item 1</p></li><li><p>Item 2</p></li></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    console.log('Lines with P:', result.lines);
    if (result.lines.length > 2) {
        throw new Error(`Expected 2 lines, got ${result.lines.length}: ${JSON.stringify(result.lines)}`);
    }
  });

  it('should not add extra lines for orphaned LI elements containing newlines and P tags', function () {
    // This simulates <li>\n<p>... which is common in pretty-printed HTML
    const html = '<html><body><li>\n<p>Item 1</p></li><li>\n<p>Item 2</p></li></body></html>';
    const dom = new JSDOM(html);
    const body = dom.window.document.body;

    cc.collectContent(body);
    const result = cc.finish();

    console.log('Lines with newline+P:', result.lines);
    // If bug exists, we expect ["*", "*Item 1", "*", "*Item 2"] (4 lines)
    if (result.lines.length > 2) {
        throw new Error(`Expected 2 lines, got ${result.lines.length}: ${JSON.stringify(result.lines)}`);
    }
  });
});
