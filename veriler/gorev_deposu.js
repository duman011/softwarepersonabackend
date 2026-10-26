const dosyaSistemi = require('node:fs');
const yol = require('node:path');

module.exports = function depoOlustur(dosyaYolu) {
  dosyaSistemi.mkdirSync(yol.dirname(dosyaYolu), { recursive: true });
  if (!dosyaSistemi.existsSync(dosyaYolu)) {
    dosyaSistemi.writeFileSync(dosyaYolu, '[]\n', 'utf8');
  }

  function oku() {
    const gorevler = JSON.parse(dosyaSistemi.readFileSync(dosyaYolu, 'utf8'));
    if (!Array.isArray(gorevler)) throw new Error('Görev dosyası bir liste içermelidir.');
    return gorevler;
  }

  function kaydet(gorevler) {
    // Önce geçici dosyaya yazılır; yarım kalan yazma asıl veriyi bozmaz.
    const geciciYol = `${dosyaYolu}.gecici`;
    dosyaSistemi.writeFileSync(geciciYol, JSON.stringify(gorevler, null, 2) + '\n', 'utf8');
    dosyaSistemi.renameSync(geciciYol, dosyaYolu);
  }

  oku();
  return { oku, kaydet };
};
