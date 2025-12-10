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
    description: 'Orphaned li element',
    html: '<html><body><li>orphaned</li></body></html>',
    wantText: ['orphaned'],
  },
  {
    description: 'Orphaned li element with nested content',
    html: '<html><body><li><b>bold</b> orphaned</li></body></html>',
    wantText: ['bold orphaned'],
  },
  {
    description: 'Multiple orphaned li elements',
    html: '<html><body><li>one</li><li>two</li></body></html>',
    wantText: ['one', 'two'],
  },
  {
    description: 'Div with ace-line class (simulating internal copy-paste)',
    html: '<html><body><div class="ace-line">content</div></body></html>',
    wantText: ['content'],
  },
  {
    description: 'Unknown element (wrapped)',
    html: '<html><body><div><unknown>content</unknown></div></body></html>',
    wantText: ['content'],
  },
  {
    description: 'Nested unknown elements (wrapped)',
    html: '<html><body><div><unknown><moreunknown>content</moreunknown></unknown></div></body></html>',
    wantText: ['content'],
  },
  {
    description: 'Table structure (unsupported but should not crash)',
    html: '<html><body><div><table><tr><td>cell1</td><td>cell2</td></tr></table></div></body></html>',
    wantText: ['cell1cell2'], // Concatenated because td/tr are not block elements
  },
  {
    description: 'Image tag (should be ignored or handled by hook)',
    html: '<html><body><div><img src="foo.png"></div></body></html>',
    wantText: [''], // Images are handled via hooks, might produce no text in default CC
  },
  {
    description: 'Break tag',
    html: '<html><body><div>line1<br>line2</div></body></html>',
    wantText: ['line1', 'line2'],
  },
  {
    description: 'Empty body',
    html: '<html><body></body></html>',
    wantText: [],
  },
  {
    description: 'Just a script tag',
    html: '<html><body><script>alert(1)</script></body></html>',
    wantText: [],
  },
  {
    description: 'Just a style tag',
    html: '<html><body><style>body { color: red; }</style></body></html>',
    wantText: [],
  },
  {
    description: 'Mixed valid and invalid nesting',
    html: '<html><body><ul><li>valid</li></ul><li>invalid</li></body></html>',
    wantText: ['*valid', 'invalid'],
  },
  {
    description: 'Deeply nested lists with missing parents',
    html: '<html><body><li><ol><li>nested</li></ol></li></body></html>',
    wantText: ['*nested'], // The outer li is orphaned, the inner ol is valid? No, inner ol is inside li.
    // Outer li: state.lineAttributes.list is undefined.
    // Inner ol: _enterList called. state.lineAttributes.list becomes 'number1'.
    // Inner li: state.lineAttributes.list is 'number1'.
    // Should produce '*nested' with list attribute.
  }
];

describe('contentcollector robustness', function () {
  for (const tc of testCases) {
    describe(tc.description, function () {
      let result: any;
      let apool: APool;

      before(async function () {
        const dom = new jsdom.JSDOM(tc.html);
        // @ts-ignore
        global.document = dom.window.document;
        apool = new AttributePool();
        for (const attrib of knownAttribs) apool.putAttrib(attrib);
        
        const abrowser = { chrome: false, safari: false, firefox: false, msie: false };
        const cc = contentcollector.makeContentCollector(true, abrowser, apool);
        try {
            cc.collectContent(document.body);
            result = cc.finish();
        } catch (e) {
            result = { error: e };
        }
      });

      it('does not crash', async function () {
        if (result.error) {
            throw result.error;
        }
      });

      it('produces expected text', async function () {
        if (tc.wantText) {
            assert.deepEqual(result.lines, tc.wantText);
        }
      });
    });
  }
});
