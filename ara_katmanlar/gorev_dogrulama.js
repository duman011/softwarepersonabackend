const oncelikler = ['low', 'medium', 'high'];
const durumlar = ['pending', 'in_progress', 'completed'];
const alanlar = ['title', 'description', 'priority', 'assignee', 'status'];

function veriyiKontrolEt(govde, kismi) {
  if (!govde || typeof govde !== 'object' || Array.isArray(govde)) {
    return 'İstek gövdesi bir JSON nesnesi olmalıdır.';
  }
  if (Object.keys(govde).length === 0) return 'En az bir alan gönderilmelidir.';
  if (Object.keys(govde).some((alan) => !alanlar.includes(alan))) {
    return `Yalnızca şu alanlar kullanılabilir: ${alanlar.join(', ')}.`;
  }
  for (const alan of ['title', 'description', 'assignee']) {
    if ((!kismi || Object.hasOwn(govde, alan)) &&
        (typeof govde[alan] !== 'string' || !govde[alan].trim())) {
      return `${alan} alanı boş olmayan bir metin olmalıdır.`;
    }
    if (typeof govde[alan] === 'string' && govde[alan].length > 2000) {
      return `${alan} alanı en fazla 2000 karakter olabilir.`;
    }
  }
  if ((!kismi || Object.hasOwn(govde, 'priority')) && !oncelikler.includes(govde.priority)) {
    return 'priority alanı low, medium veya high olmalıdır.';
  }
  if (Object.hasOwn(govde, 'status') && !durumlar.includes(govde.status)) {
    return 'status alanı pending, in_progress veya completed olmalıdır.';
  }
  return null;
}

module.exports = function gorevDogrulama(kismi = false) {
  return (istek, yanit, sonraki) => {
    const hata = veriyiKontrolEt(istek.body, kismi);
    if (hata) return yanit.status(400).json({ mesaj: hata });
    sonraki();
  };
};

