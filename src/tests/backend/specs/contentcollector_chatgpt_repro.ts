'use strict';

const contentcollector = require('../../../static/js/contentcollector');
import AttributePool from '../../../static/js/AttributePool';
import { JSDOM } from 'jsdom';
import assert from 'assert';

describe('ContentCollector ChatGPT Mixed Nesting Reproduction', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(async function () {
    apool = new AttributePool();
    const abrowser = {
      msie: false,
      mozilla: true,
      safari: false,
      omniframe: false,
    };
    cc = contentcollector.makeContentCollector(true, abrowser, apool, null);
  });

  it('correctly handles mixed nested lists (ul > li > ol AND ul > li > ul) typical for ChatGPT', function () {
    const html = `
<html>
<body>
<p>Ungeordnete Liste (unordered)</p>
<ul>
  <li>Schneeball
    <ol>
      <li>Rosa bis weiße Blüten</li>
      <li>Blüht an milden Tagen schon im Januar</li>
      <li>Optimal für große Kübel</li>
    </ol>
  </li>
  <li>Hornveilchen
    <ul>
      <li>Blühen bis zum Frost</li>
      <li>Viele Farbkombinationen</li>
      <li>Gut für Hängeampeln</li>
    </ul>
  </li>
  <li>Scheinbeere
    <ul>
      <li>Leuchtend rote Beeren</li>
    </ul>
  </li>
  <li>Ziergräser
    <ol>
      <li>Struktur im Kübel</li>
    </ol>
  </li>
  <li>Buchsbaum
    <ul>
      <li>Formbar</li>
    </ul>
  </li>
</ul>
</body>
</html>
    `;

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    cc.collectContent(doc.body);
    
    const result = cc.finish();
    const lines = result.lines;
    const lineAttribs = result.lineAttribs;

    console.log('DEBUG: Lines generated:', lines);
    console.log('DEBUG: Line Attribs:', lineAttribs);
    console.log('DEBUG: Attribute Pool:', apool.toJsonable());

    // Helper to check if a line has a specific list type
    const hasListType = (lineIndex: number, listType: string) => {
      const attribString = lineAttribs[lineIndex];
      if (!attribString) return false;
      
      // Find the ID for the list attribute
      const numToAttrib = apool.toJsonable().numToAttrib;
      let id = -1;
      for (const key in numToAttrib) {
        const [k, v] = numToAttrib[key];
        if (k === 'list' && v === listType) {
          id = parseInt(key, 10);
          break;
        }
      }
      
      if (id === -1) return false;
      
      // Check if *id is in the attribute string
      const idBase36 = id.toString(36);
      return attribString.includes('*' + idBase36);
    };

    assert.equal(lines[0].trim(), 'Ungeordnete Liste (unordered)');
    assert.equal(lines[1].trim(), '*Schneeball');
    assert.equal(lines[2].trim(), '*Rosa bis weiße Blüten'); 
    assert.equal(lines[5].trim(), '*Hornveilchen');
    assert.equal(lines[6].trim(), '*Blühen bis zum Frost');

    // Check List Types
    assert.ok(hasListType(1, 'bullet1'), 'Line 1 (Schneeball) should be bullet1');
    assert.ok(hasListType(2, 'number2'), 'Line 2 (Rosa) should be number2');
    assert.ok(hasListType(5, 'bullet1'), 'Line 5 (Hornveilchen) should be bullet1');
    assert.ok(hasListType(6, 'bullet2'), 'Line 6 (Blühen) should be bullet2');
  });
});
