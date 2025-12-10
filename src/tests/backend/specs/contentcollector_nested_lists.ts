'use strict';

import {APool} from "../../../node/types/PadType";
import AttributePool from '../../../static/js/AttributePool';
const contentcollector = require('../../../static/js/contentcollector');
import jsdom from 'jsdom';
const assert = require('assert').strict;

describe('contentcollector nested lists reproduction', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(async function () {
    apool = new AttributePool();
    // @ts-ignore
    apool.putAttrib(['author', '']);
  });

  it('handles UL containing OL (mixed list types)', async function () {
    const html = '<html><body><ul><li>Bullet</li><ol><li>Number</li></ol></ul></body></html>';
    const dom = new jsdom.JSDOM(html);
    cc = contentcollector.makeContentCollector(true, null, apool, null);
    cc.collectContent(dom.window.document.body);
    const result = cc.finish();
    
    // Expected:
    // Line 1: Bullet (list: bullet1)
    // Line 2: Number (list: number2)
    
    const lines = result.lines;
    const attribs = result.lineAttribs;
    
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
      attribs.pop();
    }

    assert.equal(lines[0], '*Bullet');
    assert.equal(lines[1], '*Number');
    
    // Check attributes for line 2
    // We expect list:number2 (nested in bullet1)
    
    const listNum2 = apool.putAttrib(['list', 'number2']);
    const listNum2Base36 = listNum2.toString(36);
    
    assert.ok(attribs[1].includes('*' + listNum2Base36), 'Line 2 should be number2');
  });

  it('respects start attribute on OL', async function () {
    const html = '<html><body><ol start="5"><li>Item</li></ol></body></html>';
    const dom = new jsdom.JSDOM(html);
    cc = contentcollector.makeContentCollector(true, null, apool, null);
    cc.collectContent(dom.window.document.body);
    const result = cc.finish();
    
    const lines = result.lines;
    const attribs = result.lineAttribs;
    
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
      attribs.pop();
    }

    assert.equal(lines[0], '*Item');
    
    // Verify start attribute
    // We need to check if 'start' attribute is present in the pool and used in the line.
    const start5 = apool.putAttrib(['start', '5']);
    // The attribute string should contain this ID.
    // attribs[0] is like '*0*1*2+4'
    // We can check if it contains base36(start5)
    const start5Base36 = start5.toString(36);
    const regex = new RegExp(`\\*${start5Base36}(?![0-9a-z])`);
    assert.match(attribs[0], regex, 'Line attributes should contain start:5');
  });
});
