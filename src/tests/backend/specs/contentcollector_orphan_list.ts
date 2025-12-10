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
];

const testCases = [
  {
    description: 'Orphaned li element (Broken HTML)',
    html: '<html><body><li>orphaned</li></body></html>',
    wantText: ['*orphaned'], // Expecting it to be treated as a list item (bullet default)
  },
  {
    description: 'Proper ul list (Correct HTML)',
    html: '<html><body><ul><li>proper</li></ul></body></html>',
    wantText: ['*proper'],
  }
];

describe('contentcollector orphan list fix', function () {
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
        
        const cc = contentcollector.makeContentCollector(true, null, apool);
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
