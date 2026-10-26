const uygulamaOlustur = require('./uygulama');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT, 1 ile 65535 arasında bir tam sayı olmalıdır.');
}

const sunucu = uygulamaOlustur().listen(port, () => {
  console.log(`Taskflow çalışıyor: http://localhost:${port}`);
});

sunucu.on('error', (hata) => {
  console.error('Sunucu başlatılamadı:', hata.message);
  process.exitCode = 1;
});
