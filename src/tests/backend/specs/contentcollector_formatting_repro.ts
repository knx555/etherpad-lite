'use strict';

import {APool} from "../../../node/types/PadType";
import AttributePool from '../../../static/js/AttributePool';
const Changeset = require('../../../static/js/Changeset');
const assert = require('assert').strict;
import attributes from '../../../static/js/attributes';
const contentcollector = require('../../../static/js/contentcollector');
import jsdom from 'jsdom';
import {Attribute} from "../../../static/js/types/Attribute";

const knownAttribs: Attribute[] = [
  ['insertorder', 'first'],
  ['list', 'bullet1'],
  ['list', 'number1'],
  ['lmkr', '1'],
  ['start', '1'],
  ['author', 'a.author1'],
  ['bold', 'true'],
  ['italic', 'true'],
  ['underline', 'true'],
  ['strikethrough', 'true'],
];

const testCases = [
  {
    description: 'Text followed by OL with orphaned text',
    html: '<html><body>Text<ol>Orphaned</ol></body></html>',
    wantText: ['Text', '*Orphaned'], // Expect newline and list marker
  },
  {
    description: 'Text followed by UL with orphaned text',
    html: '<html><body>Text<ul>Orphaned</ul></body></html>',
    wantText: ['Text', '*Orphaned'], // Expect newline and list marker
  },
  {
    description: 'Text followed by OL with LI',
    html: '<html><body>Text<ol><li>Item</li></ol></body></html>',
    wantText: ['Text', '*Item'], // Expect newline
  },
  {
    description: 'Text followed by UL with LI',
    html: '<html><body>Text<ul><li>Item</li></ul></body></html>',
    wantText: ['Text', '*Item'], // Expect newline
  }
];

describe('contentcollector formatting reproduction', function () {
  let cc: any;
  let apool: AttributePool;

  beforeEach(async function () {
    apool = new AttributePool();
    // @ts-ignore
    apool.putAttrib(['author', '']);
  });

  for (const testCase of testCases) {
    it(testCase.description, async function () {
      const dom = new jsdom.JSDOM(testCase.html);
      cc = contentcollector.makeContentCollector(true, null, apool, null);
      cc.collectContent(dom.window.document.body);
      const result = cc.finish();
      const textLines = result.lines;
      
      // Remove the last empty line if it exists (contentcollector often adds one)
      if (textLines.length > 0 && textLines[textLines.length - 1] === '') {
        textLines.pop();
      }

      // Check text content
      // We only check if the lines match the expected text lines
      // We don't check attributes here for simplicity, just the line splitting
      
      // If the result has fewer lines than expected, it means newlines were missed
      assert.equal(textLines.length, testCase.wantText.length, 
        `Expected ${testCase.wantText.length} lines, got ${textLines.length}. Content: ${JSON.stringify(textLines)}`);
      
      for (let i = 0; i < testCase.wantText.length; i++) {
        // We might need to handle the list marker '*' which is added by contentcollector
        // The test case expectation should include it if expected
        assert.equal(textLines[i], testCase.wantText[i]);
      }
    });
  }
});
