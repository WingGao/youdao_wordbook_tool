import MdictClient from './engine_mdict';

describe('mdict', () => {
  let client = new MdictClient();
  test('lookup', async () => {
    let word = await client.lookup('due');
    expect(word.cn).not.toBeNull();
  });
});
