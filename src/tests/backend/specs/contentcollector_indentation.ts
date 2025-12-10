'use strict';

const contentcollector = require('../../../static/js/contentcollector');
import AttributePool from '../../../static/js/AttributePool';
import {JSDOM} from 'jsdom';
import assert from 'assert';

describe('ContentCollector Indentation / Nesting', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(async function () {
    apool = new AttributePool();
    // collectStyles=true, abrowser={}
    cc = contentcollector.makeContentCollector(true, {}, apool, {});
  });

  it('correctly handles nested unordered lists', function () {
    const html = `
      <html>
      <body>
        <ul>
          <li>Level 1 Item 1</li>
          <li>Level 1 Item 2
            <ul>
              <li>Level 2 Item 1</li>
              <li>Level 2 Item 2</li>
            </ul>
          </li>
          <li>Level 1 Item 3</li>
        </ul>
      </body>
      </html>
    `;

    const dom = new JSDOM(html);
    cc.collectContent(dom.window.document.body);
    const result = cc.finish();
    const textLines = result.lines;
    const attribLines = result.lineAttribs;

    // Helper to resolve attributes
    const resolveAttribs = (lineNum: number) => {
        const attribStr = attribLines[lineNum];
        const attribs: any = {};
        if (!attribStr) return attribs;
        
        const regex = /\*([0-9a-z]+)/g;
        let match;
        while ((match = regex.exec(attribStr)) !== null) {
            const num = parseInt(match[1], 36);
            const [key, value] = apool.getAttrib(num);
            attribs[key] = value;
        }
        return attribs;
    };

    // Debug output
    /*
    for (let i = 0; i < textLines.length; i++) {
        console.log(`Line ${i}: ${textLines[i]}`);
        console.log(`Attribs: ${attribLines[i]}`);
    }
    */

    const l0 = resolveAttribs(0);
    assert.strictEqual(textLines[0].trim(), '*Level 1 Item 1');
    assert.strictEqual(l0.list, 'bullet1');

    const l1 = resolveAttribs(1);
    assert.strictEqual(textLines[1].trim(), '*Level 1 Item 2');
    assert.strictEqual(l1.list, 'bullet1');

    const l2 = resolveAttribs(2);
    assert.strictEqual(textLines[2].trim(), '*Level 2 Item 1');
    assert.strictEqual(l2.list, 'bullet2');

    const l3 = resolveAttribs(3);
    assert.strictEqual(textLines[3].trim(), '*Level 2 Item 2');
    assert.strictEqual(l3.list, 'bullet2');

    const l4 = resolveAttribs(4);
    assert.strictEqual(textLines[4].trim(), '*Level 1 Item 3');
    assert.strictEqual(l4.list, 'bullet1');
  });

  it('correctly handles mixed nested lists (bullet -> number)', function () {
    const html = `
      <html>
      <body>
        <ul>
          <li>Bullet 1
            <ol>
              <li>Number 1</li>
            </ol>
          </li>
        </ul>
      </body>
      </html>
    `;

    const dom = new JSDOM(html);
    cc.collectContent(dom.window.document.body);
    const result = cc.finish();
    const textLines = result.lines;
    const attribLines = result.lineAttribs;

    const resolveAttribs = (lineNum: number) => {
        const attribStr = attribLines[lineNum];
        const attribs: any = {};
        if (!attribStr) return attribs;
        const regex = /\*([0-9a-z]+)/g;
        let match;
        while ((match = regex.exec(attribStr)) !== null) {
            const num = parseInt(match[1], 36);
            const [key, value] = apool.getAttrib(num);
            attribs[key] = value;
        }
        return attribs;
    };

    const l0 = resolveAttribs(0);
    assert.strictEqual(textLines[0].trim(), '*Bullet 1');
    assert.strictEqual(l0.list, 'bullet1');

    const l1 = resolveAttribs(1);
    assert.strictEqual(textLines[1].trim(), '*Number 1');
    assert.strictEqual(l1.list, 'number2'); 
  });

  it('correctly handles mixed nested lists (bullet -> bullet)', function () {
    const html = `
      <html>
      <body>
        <ul>
          <li>Bullet 1
            <ul>
              <li>Bullet 2</li>
            </ul>
          </li>
        </ul>
      </body>
      </html>
    `;

    const dom = new JSDOM(html);
    cc.collectContent(dom.window.document.body);
    const result = cc.finish();
    const textLines = result.lines;
    const attribLines = result.lineAttribs;

    const resolveAttribs = (lineNum: number) => {
        const attribStr = attribLines[lineNum];
        const attribs: any = {};
        if (!attribStr) return attribs;
        const regex = /\*([0-9a-z]+)/g;
        let match;
        while ((match = regex.exec(attribStr)) !== null) {
            const num = parseInt(match[1], 36);
            const [key, value] = apool.getAttrib(num);
            attribs[key] = value;
        }
        return attribs;
    };

    const l0 = resolveAttribs(0);
    assert.strictEqual(textLines[0].trim(), '*Bullet 1');
    assert.strictEqual(l0.list, 'bullet1');

    const l1 = resolveAttribs(1);
    assert.strictEqual(textLines[1].trim(), '*Bullet 2');
    assert.strictEqual(l1.list, 'bullet2');
  });
});
