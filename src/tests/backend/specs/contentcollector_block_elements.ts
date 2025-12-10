'use strict';

import {APool} from "../../../node/types/PadType";
import AttributePool from '../../../static/js/AttributePool';
const contentcollector = require('../../../static/js/contentcollector');
import jsdom from 'jsdom';
const assert = require('assert').strict;

describe('contentcollector block elements reproduction', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(async function () {
    apool = new AttributePool();
    // @ts-ignore
    apool.putAttrib(['author', '']);
  });

  const testCases = [
    {
      description: 'Text followed by H1',
      html: '<html><body>Text<h1>Heading</h1></body></html>',
      wantText: ['Text', 'Heading'], 
    },
    {
      description: 'Text followed by H2',
      html: '<html><body>Text<h2>Heading</h2></body></html>',
      wantText: ['Text', 'Heading'], 
    },
    {
      description: 'Text followed by Blockquote',
      html: '<html><body>Text<blockquote>Quote</blockquote></body></html>',
      wantText: ['Text', 'Quote'], 
    },
    {
      description: 'Text followed by Section',
      html: '<html><body>Text<section>Section</section></body></html>',
      wantText: ['Text', 'Section'], 
    },
    {
      description: 'Text followed by P (Control)',
      html: '<html><body>Text<p>Paragraph</p></body></html>',
      wantText: ['Text', 'Paragraph'], 
    }
  ];

  for (const testCase of testCases) {
    it(testCase.description, async function () {
      const dom = new jsdom.JSDOM(testCase.html);
      cc = contentcollector.makeContentCollector(true, null, apool, null);
      cc.collectContent(dom.window.document.body);
      const result = cc.finish();
      const textLines = result.lines;
      
      if (textLines.length > 0 && textLines[textLines.length - 1] === '') {
        textLines.pop();
      }

      assert.equal(textLines.length, testCase.wantText.length, 
        `Expected ${testCase.wantText.length} lines, got ${textLines.length}. Content: ${JSON.stringify(textLines)}`);
      
      for (let i = 0; i < testCase.wantText.length; i++) {
        assert.equal(textLines[i], testCase.wantText[i]);
      }
    });
  }
});
