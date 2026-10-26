const express = require('express');

module.exports = function raporRotalari(depo) {
  const yonlendirici = express.Router();

  yonlendirici.get('/completed', (istek, yanit) => {
    yanit.json({ completed: depo.oku().filter((gorev) => gorev.status === 'completed').length });
  });

  yonlendirici.get('/pending', (istek, yanit) => {
    yanit.json({ pending: depo.oku().filter((gorev) => gorev.status === 'pending').length });
  });

  yonlendirici.get('/summary', (istek, yanit) => {
    const gorevler = depo.oku();
    const ozet = { total: gorevler.length, pending: 0, in_progress: 0, completed: 0 };
    for (const gorev of gorevler) ozet[gorev.status] += 1;
    yanit.json(ozet);
  });

  return yonlendirici;
};
