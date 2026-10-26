module.exports = function istekKaydi(istek, yanit, sonraki) {
  console.log(`[${new Date().toISOString()}] ${istek.method} ${istek.originalUrl}`);
  sonraki();
};
