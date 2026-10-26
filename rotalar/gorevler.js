const express = require('express');
const { randomUUID: kimlikOlustur } = require('node:crypto');

const gorevDogrulama = require('../ara_katmanlar/gorev_dogrulama');
const alanlar = ['title', 'description', 'priority', 'assignee', 'status'];

module.exports = function gorevRotalari(depo) {
  const yonlendirici = express.Router();

  function listele(istek, yanit) {
    const sorgu = istek.query;
    const izinliAlanlar = ['status', 'priority', 'keyword', 'page', 'limit', 'sort'];
    if (Object.entries(sorgu).some(([alan, deger]) =>
      !izinliAlanlar.includes(alan) || typeof deger !== 'string')) {
      return yanit.status(400).json({ mesaj: 'Geçersiz veya tekrarlanan sorgu parametresi.' });
    }
    if (sorgu.status !== undefined && !['pending', 'in_progress', 'completed'].includes(sorgu.status)) {
      return yanit.status(400).json({ mesaj: 'Geçersiz status filtresi.' });
    }
    if (sorgu.priority !== undefined && !['low', 'medium', 'high'].includes(sorgu.priority)) {
      return yanit.status(400).json({ mesaj: 'Geçersiz priority filtresi.' });
    }
    if (sorgu.keyword !== undefined && (!sorgu.keyword.trim() || sorgu.keyword.length > 2000)) {
      return yanit.status(400).json({ mesaj: 'keyword, 1-2000 karakterlik bir metin olmalıdır.' });
    }
    if (istek.path === '/search' && sorgu.keyword === undefined) {
      return yanit.status(400).json({ mesaj: 'Arama için keyword gereklidir.' });
    }
    const siralamaAlanlari = ['createdAt', 'updatedAt', 'title', 'priority', 'status', 'assignee'];
    if (sorgu.sort !== undefined && !siralamaAlanlari.includes(sorgu.sort.replace(/^-/, ''))) {
      return yanit.status(400).json({ mesaj: 'Geçersiz sort alanı.' });
    }
    for (const alan of ['page', 'limit']) {
      if (sorgu[alan] !== undefined && (!/^[1-9]\d*$/.test(sorgu[alan]) ||
        !Number.isSafeInteger(Number(sorgu[alan])))) {
        return yanit.status(400).json({ mesaj: `${alan} pozitif bir tam sayı olmalıdır.` });
      }
    }
    const sayfa = Number(sorgu.page || 1);
    const adet = Number(sorgu.limit || 10);
    if (adet > 100 || !Number.isSafeInteger(sayfa * adet)) {
      return yanit.status(400).json({ mesaj: 'limit en fazla 100 olmalı; sayfa aralığı sayı sınırını aşmamalıdır.' });
    }

    let gorevler = depo.oku();
    if (sorgu.status) gorevler = gorevler.filter((gorev) => gorev.status === sorgu.status);
    if (sorgu.priority) gorevler = gorevler.filter((gorev) => gorev.priority === sorgu.priority);
    if (istek.params.calisan) {
      gorevler = gorevler.filter((gorev) =>
        gorev.assignee.toLocaleLowerCase('tr') === istek.params.calisan.toLocaleLowerCase('tr'));
    }
    if (sorgu.keyword) {
      const kelime = sorgu.keyword.trim().toLocaleLowerCase('tr');
      gorevler = gorevler.filter((gorev) =>
        `${gorev.title} ${gorev.description}`.toLocaleLowerCase('tr').includes(kelime));
    }
    if (sorgu.sort) {
      const ters = sorgu.sort.startsWith('-');
      const alan = sorgu.sort.replace(/^-/, '');
      const oncelikSirasi = { low: 1, medium: 2, high: 3 };
      gorevler.sort((ilk, ikinci) => {
        const sonuc = alan === 'priority'
          ? oncelikSirasi[ilk.priority] - oncelikSirasi[ikinci.priority]
          : ilk[alan].localeCompare(ikinci[alan], 'tr');
        return ters ? -sonuc : sonuc;
      });
    }
    if (sorgu.page !== undefined || sorgu.limit !== undefined) {
      yanit.set('X-Total-Count', String(gorevler.length));
      gorevler = gorevler.slice((sayfa - 1) * adet, sayfa * adet);
    }
    yanit.json(gorevler);
  }

  // Sabit yollar, /:kimlik rotasından önce tanımlanır.
  yonlendirici.get('/', listele);
  yonlendirici.get('/search', listele);
  yonlendirici.get('/assignee/:calisan', listele);

  yonlendirici.post('/', gorevDogrulama(), (istek, yanit) => {
    const zaman = new Date().toISOString();
    const gorev = { id: kimlikOlustur() };
    for (const alan of alanlar) {
      if (Object.hasOwn(istek.body, alan)) gorev[alan] = istek.body[alan].trim();
    }
    gorev.status = gorev.status || 'pending';
    gorev.createdAt = zaman;
    gorev.updatedAt = zaman;

    const gorevler = depo.oku();
    gorevler.push(gorev);
    depo.kaydet(gorevler);
    yanit.location(`/tasks/${gorev.id}`).status(201).json(gorev);
  });

  // Detay, güncelleme ve silme öncesinde görev bir kez aranır.
  yonlendirici.param('kimlik', (istek, yanit, sonraki, kimlik) => {
    const gorevler = depo.oku();
    const sira = gorevler.findIndex((gorev) => gorev.id === kimlik);
    if (sira === -1) return yanit.status(404).json({ mesaj: 'Görev bulunamadı.' });
    istek.gorevler = gorevler;
    istek.gorevSirasi = sira;
    sonraki();
  });

  yonlendirici.get('/:kimlik', (istek, yanit) => {
    yanit.json(istek.gorevler[istek.gorevSirasi]);
  });

  yonlendirici.put('/:kimlik', gorevDogrulama(true), (istek, yanit) => {
    const gorev = istek.gorevler[istek.gorevSirasi];
    for (const alan of alanlar) {
      if (Object.hasOwn(istek.body, alan)) gorev[alan] = istek.body[alan].trim();
    }
    gorev.updatedAt = new Date().toISOString();
    depo.kaydet(istek.gorevler);
    yanit.json(gorev);
  });

  yonlendirici.delete('/:kimlik', (istek, yanit) => {
    istek.gorevler.splice(istek.gorevSirasi, 1);
    depo.kaydet(istek.gorevler);
    yanit.status(204).end();
  });

  return yonlendirici;
};
