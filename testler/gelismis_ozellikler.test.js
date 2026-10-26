const { test: sinama } = require('node:test');
const dogrula = require('node:assert/strict');
const { mkdtempSync: klasorOlustur, rmSync: klasorSil } = require('node:fs');
const { tmpdir: geciciKlasor } = require('node:os');
const yol = require('node:path');
const uygulamaOlustur = require('../uygulama');

sinama('Filtreleme, arama, sıralama, sayfalama ve raporlar', async (baglam) => {
  const klasor = klasorOlustur(yol.join(geciciKlasor(), 'taskflow-gelismis-'));
  const sunucu = uygulamaOlustur({ veriDosyasi: yol.join(klasor, 'gorevler.json') }).listen(0);
  await new Promise((coz) => sunucu.once('listening', coz));
  const adres = `http://127.0.0.1:${sunucu.address().port}`;
  baglam.after(async () => {
    await new Promise((coz) => sunucu.close(coz));
    klasorSil(klasor, { recursive: true, force: true });
  });
  const gorevler = [
    { title: 'Backend', description: 'API hazırla', priority: 'high', assignee: 'Musa', status: 'completed' },
    { title: 'Arayüz', description: 'Backend bağlantısı', priority: 'low', assignee: 'Ayşe', status: 'pending' },
    { title: 'Test', description: 'İstekleri dene', priority: 'medium', assignee: 'Musa', status: 'in_progress' }
  ];
  for (const gorev of gorevler) {
    const yanit = await fetch(adres + '/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gorev)
    });
    dogrula.equal(yanit.status, 201);
  }
  async function getir(uzanti) {
    const yanit = await fetch(adres + uzanti);
    dogrula.equal(yanit.status, 200, uzanti);
    return yanit.json();
  }
  dogrula.equal((await getir('/tasks?status=completed'))[0].title, 'Backend');
  dogrula.equal((await getir('/tasks?priority=low'))[0].title, 'Arayüz');
  dogrula.equal((await getir('/tasks?status=pending&priority=high')).length, 0);
  dogrula.equal((await getir('/tasks/search?keyword=BACKEND')).length, 2);
  dogrula.equal((await getir('/tasks/search?keyword=olmayan')).length, 0);
  dogrula.equal((await getir('/tasks/assignee/musa')).length, 2);
  dogrula.equal((await getir('/tasks/assignee/Ay%C5%9Fe?status=pending')).length, 1);
  dogrula.deepEqual((await getir('/tasks?sort=priority')).map((gorev) => gorev.priority), ['low', 'medium', 'high']);
  dogrula.deepEqual((await getir('/tasks?sort=-priority')).map((gorev) => gorev.priority), ['high', 'medium', 'low']);
  dogrula.deepEqual((await getir('/tasks?sort=title')).map((gorev) => gorev.title), ['Arayüz', 'Backend', 'Test']);
  dogrula.equal((await getir('/tasks?sort=createdAt')).length, 3);
  const sayfa = await fetch(adres + '/tasks?page=2&limit=1&sort=title');
  dogrula.equal(sayfa.headers.get('x-total-count'), '3');
  dogrula.equal((await sayfa.json())[0].title, 'Backend');
  dogrula.deepEqual(await getir('/tasks?page=10&limit=10'), []);
  dogrula.equal((await getir('/tasks?limit=1')).length, 1);
  dogrula.deepEqual(await getir('/reports/completed'), { completed: 1 });
  dogrula.deepEqual(await getir('/reports/pending'), { pending: 1 });
  dogrula.deepEqual(await getir('/reports/summary'), { total: 3, pending: 1, in_progress: 1, completed: 1 });
  for (const sorgu of ['page=0', 'page=-1', 'page=1.5', 'page=1e2', 'limit=101', 'limit=0',
    'page=9007199254740991', 'sort=id', 'status=bitti', 'priority=acil', 'keyword=',
    'status=pending&status=completed', 'bilinmeyen=1']) {
    dogrula.equal((await fetch(adres + '/tasks?' + sorgu)).status, 400, sorgu);
  }
  dogrula.equal((await fetch(adres + '/tasks/search')).status, 400);
  dogrula.equal((await fetch(adres + '/tasks/search?keyword=%20')).status, 400);
});
