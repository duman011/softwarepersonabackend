const express = require('express');
const yol = require('node:path');
const istekKaydi = require('./ara_katmanlar/istek_kaydi');
const depoOlustur = require('./veriler/gorev_deposu');
const gorevRotalari = require('./rotalar/gorevler');
const raporRotalari = require('./rotalar/raporlar');

module.exports = function uygulamaOlustur(ayarlar = {}) {
  const uygulama = express();
  const depo = depoOlustur(ayarlar.veriDosyasi || yol.join(__dirname, 'veriler/gorevler.json'));

  uygulama.disable('x-powered-by');
  uygulama.use(istekKaydi);
  uygulama.use(express.json({ limit: '32kb' }));
  uygulama.get('/', (istek, yanit) => {
    yanit.json({ mesaj: 'Taskflow Görev Yönetimi API', gorevler: '/tasks' });
  });
  uygulama.use('/tasks', gorevRotalari(depo));
  uygulama.use('/reports', raporRotalari(depo));
  uygulama.use((istek, yanit) => {
    yanit.status(404).json({ mesaj: 'İstenen adres bulunamadı.' });
  });

  // Express, hata yakalayan ara katmanı dört parametresinden tanır.
  uygulama.use((hata, istek, yanit, sonraki) => {
    if (hata.type === 'entity.parse.failed') {
      return yanit.status(400).json({ mesaj: 'Geçerli bir JSON gövdesi gönderin.' });
    }
    if (hata.type === 'entity.too.large') {
      return yanit.status(413).json({ mesaj: 'İstek gövdesi 32 KB sınırını aşıyor.' });
    }
    if (hata.status >= 400 && hata.status < 500) {
      return yanit.status(hata.status).json({ mesaj: 'İstek gövdesi okunamadı.' });
    }
    console.error('İstek işlenirken hata oluştu:', hata);
    yanit.status(500).json({ mesaj: 'Sunucuda bir hata oluştu.' });
  });
  return uygulama;
};
