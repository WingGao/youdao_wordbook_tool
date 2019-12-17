import sqlite3
import zlib
from mdict_utils.base.readmdict import MDX, MDD
from tqdm import tqdm
import os


# 创建dict sqlite
def unpack_to_db(target, source, encoding='', substyle=False, passcode=None, zip=True):
    # if not os.path.exists(target):
    #     raise Exception('no such' + target)
    # name, _ = os.path.splitext(os.path.basename(source))
    # db_name = os.path.join(target, name + '.db')
    db_name = target
    print('unpack_to_db', source)
    with sqlite3.connect(db_name) as conn:
        if source.endswith('.mdx'):
            mdx = MDX(source, encoding, substyle, passcode)

            conn.execute('DROP TABLE IF EXISTS meta')
            conn.execute('CREATE TABLE meta (key TEXT NOT NULL, value TEXT NOT NULL)')
            meta = {}
            for key, value in mdx.header.items():
                key = key.decode(mdx._encoding).lower()
                value = '\r\n'.join(value.decode(mdx._encoding).splitlines())
                meta[key] = value
            meta['zip'] = zip
            conn.executemany('INSERT INTO meta VALUES (?,?)', meta.items())
            conn.commit()

            conn.execute('DROP TABLE IF EXISTS mdx')
            if zip:
                conn.execute('CREATE TABLE mdx (entry TEXT NOT NULL, paraphrase BLOB NOT NULL)')
            else:
                conn.execute('CREATE TABLE mdx (entry TEXT NOT NULL, paraphrase TEXT NOT NULL)')
            # 在mdx时创建mdd
            conn.execute('DROP TABLE IF EXISTS mdd')
            conn.execute('CREATE TABLE mdd (entry TEXT NOT NULL, file BLOB NOT NULL)')
            conn.execute('CREATE INDEX mdd_entry_index ON mdd (entry)')

            bar = tqdm(total=len(mdx), unit='rec')
            max_batch = 1024
            count = 0
            entries = []
            for key, value in mdx.items():
                if not value.strip():
                    continue
                count += 1
                key = key.decode(mdx._encoding)
                if zip:
                    value = zlib.compress(value)
                else:
                    value = value.decode(mdx._encoding)
                entries.append((key, value))
                if count > max_batch:
                    conn.executemany('INSERT INTO mdx VALUES (?,?)', entries)
                    conn.commit()
                    count = 0
                    entries = []
                bar.update(1)
            if entries:
                conn.executemany('INSERT INTO mdx VALUES (?,?)', entries)
                conn.commit()
            bar.close()
            conn.execute('CREATE INDEX mdx_entry_index ON mdx (entry)')

        elif source.endswith('.mdd'):
            mdd = MDD(source, passcode)
            bar = tqdm(total=len(mdd), unit='rec')
            max_batch = 1024 * 1024 * 10
            count = 0
            for key, value in mdd.items():
                count += len(value)
                key = key.decode('UTF-8').lower()
                conn.execute('INSERT INTO mdd VALUES (?,?)', (key, value))
                if count > max_batch:
                    conn.commit()
                    count = 0
                bar.update(1)
            conn.commit()
            bar.close()


def dict_to_db(dict_dir):
    files = os.listdir(dict_dir)
    mdx_path = None
    mdd_paths = []
    for i in files:
        fu = os.path.join(dict_dir, i)
        if i.endswith('.mdx'):
            mdx_path = fu
        elif i.endswith('.mdd'):
            mdd_paths.append(fu)
    out_path = os.path.abspath(os.path.join(__file__, '..', '..', 'mdict', 'oalecd9.db0'))
    unpack_to_db(out_path, mdx_path, zip=False)
    for i in mdd_paths:
        unpack_to_db(out_path, i, zip=False)
    pass


if __name__ == '__main__':
    dict_to_db('/Users/ppd-03020144/Downloads/牛津高阶第九版 v3.1.2/')
