const { test: sinama } = require('node:test');
const dogrula = require('node:assert/strict');
const { mkdtempSync: geciciKlasorOlustur, rmSync: klasorSil, readFileSync: dosyaOku } = require('node:fs');
const { tmpdir: geciciKlasor } = require('node:os');
const yol = require('node:path');
const uygulamaOlustur = require('../uygulama');

sinama('Görev yaşam döngüsü, kalıcılık ve hatalı istekler', async (sinamaBaglami) => {
  const klasor = geciciKlasorOlustur(yol.join(geciciKlasor(), 'taskflow-'));
  const veriDosyasi = yol.join(klasor, 'gorevler.json');
  let sunucu = uygulamaOlustur({ veriDosyasi }).listen(0);
  await new Promise((coz) => sunucu.once('listening', coz));
  let adres = `http://127.0.0.1:${sunucu.address().port}`;
  sinamaBaglami.after(async () => {
    await new Promise((coz) => sunucu.close(coz));
    klasorSil(klasor, { recursive: true, force: true });
  });

  async function istekGonder(uzanti, yontem = 'GET', govde) {
    return fetch(adres + uzanti, {
      method: yontem,
      headers: { 'Content-Type': 'application/json' },
      body: govde === undefined ? undefined : JSON.stringify(govde)
    });
  }

  dogrula.deepEqual(await (await istekGonder('/tasks')).json(), []);
  const bilgiler = {
    title: '  Backend API hazırlığı  ', description: 'Görev uçlarını geliştir.',
    priority: 'high', assignee: 'Abdullah'
  };
  const ekleme = await istekGonder('/tasks', 'POST', bilgiler);
  dogrula.equal(ekleme.status, 201);
  const gorev = await ekleme.json();
  dogrula.equal(gorev.title, 'Backend API hazırlığı');
  dogrula.equal(gorev.status, 'pending');
  dogrula.equal(ekleme.headers.get('location'), `/tasks/${gorev.id}`);
  dogrula.deepEqual(await (await istekGonder(`/tasks/${gorev.id}`)).json(), gorev);
  dogrula.equal((await (await istekGonder('/tasks')).json()).length, 1);

  const guncelleme = await istekGonder(`/tasks/${gorev.id}`, 'PUT', { status: 'completed', priority: 'low' });
  dogrula.equal(guncelleme.status, 200);
  const guncelGorev = await guncelleme.json();
  dogrula.equal(guncelGorev.status, 'completed');
  dogrula.equal(guncelGorev.title, gorev.title);
  dogrula.equal(guncelGorev.createdAt, gorev.createdAt);

  // Sunucu yeniden açıldığında kaydedilen görev korunmalı.
  await new Promise((coz) => sunucu.close(coz));
  sunucu = uygulamaOlustur({ veriDosyasi }).listen(0);
  await new Promise((coz) => sunucu.once('listening', coz));
  adres = `http://127.0.0.1:${sunucu.address().port}`;
  dogrula.equal((await (await istekGonder(`/tasks/${gorev.id}`)).json()).status, 'completed');

  for (const govde of [{}, [], { ...bilgiler, title: ' ' }, { ...bilgiler, priority: 'acil' },
    { ...bilgiler, assignee: 12 }, { ...bilgiler, status: 'bitti' }, { ...bilgiler, id: 'elle' }]) {
    dogrula.equal((await istekGonder('/tasks', 'POST', govde)).status, 400);
  }
  for (const govde of [{}, { title: null }, { id: 'elle' }, { status: 'bitti' }]) {
    dogrula.equal((await istekGonder(`/tasks/${gorev.id}`, 'PUT', govde)).status, 400);
  }
  const bozukJson = await fetch(adres + '/tasks', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  });
  dogrula.equal(bozukJson.status, 400);
  const buyukGovde = await istekGonder('/tasks', 'POST', { ...bilgiler, description: 'a'.repeat(40000) });
  dogrula.equal(buyukGovde.status, 413);
  dogrula.equal((await istekGonder('/olmayan-adres')).status, 404);
  dogrula.equal((await istekGonder('/tasks/olmayan-kimlik')).status, 404);
  const silme = await istekGonder(`/tasks/${gorev.id}`, 'DELETE');
  dogrula.equal(silme.status, 204);
  dogrula.equal(await silme.text(), '');
  dogrula.equal((await istekGonder(`/tasks/${gorev.id}`)).status, 404);
  dogrula.deepEqual(JSON.parse(dosyaOku(veriDosyasi, 'utf8')), []);
});
