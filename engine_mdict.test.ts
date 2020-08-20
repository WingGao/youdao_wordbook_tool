import MdictClient from './engine_mdict';

describe('mdict', () => {
  let client = new MdictClient();
  test('lookup', async () => {
    // 多词性
    let wProspect = await client.lookup('prospect');
    let wTender = await client.lookup('tender');
    expect(wTender.pharas[0].name).toContain(' | ');
    let wCalm = await client.lookup('calm');
    let spring = await client.lookup('spring');
    expect(spring.pharas[6].tags).toContain('phr-v');
    let relieve = await client.lookup('relieve');
    let word = await client.lookup('due');
    expect(word.cn).not.toBeNull();
  });
});
