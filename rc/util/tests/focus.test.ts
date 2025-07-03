/* eslint-disable class-methods-use-this */
import { getFocusNodeList } from '../src/Dom/focus';
import { spyElementPrototype } from '../src/test/domHook';

describe('focus', () => {
  beforeAll(() => {
    spyElementPrototype(HTMLElement, 'offsetParent', {
      get: () => document.body,
    });
  });

  it('getFocusNodeList', () => {
    const div = document.createElement('div');
    div.setAttribute('tabIndex', '0');
    document.body.appendChild(div);

    div.innerHTML = [
      '<input disabled />',
      '<button></button>',
      '<textarea tabindex="-1"></textarea>',
      '<a>noop</a>',
      '<a href="light">go</a>',
      '<div contenteditable="true"></div>',
    ].join('');

    (div.lastChild as any).isContentEditable = true;

    const focusList = getFocusNodeList(div);
    expect(focusList).toHaveLength(4);

    const tabFocusList = getFocusNodeList(div, true);
    expect(tabFocusList).toHaveLength(5);
  });
});
