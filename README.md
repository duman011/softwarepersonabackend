# Taskflow — Görev Yönetimi API

Node.js ve Express ile hazırlanan staj projesi. Görev oluşturma, çalışanlara atama, listeleme, detay görüntüleme, güncelleme ve silme işlemleri REST API üzerinden yapılır. Her isteğin yöntemi, adresi ve zamanı terminale yazılır.

## Kurulum

Node.js 22 veya üzeri ve npm gerekir. Veritabanı kurulumu gerekmez.

1. Proje klasörünü indirin veya GitHub deposunu klonlayın.
2. Terminalde `package.json` dosyasının bulunduğu klasöre geçin.
3. Bağımlılıkları kurun ve sunucuyu başlatın:

```bash
npm ci
npm start
```

Adres: `http://localhost:3000`. Durdurmak için `Ctrl+C` kullanın.

Geliştirirken değişikliklerin otomatik yüklenmesi için `npm run dev` çalıştırın. Farklı port için Linux/macOS üzerinde `PORT=3001 npm start`, PowerShell üzerinde `$env:PORT=3001; npm start` kullanın.

## Kullanım

| Yöntem | Adres | Sonuç |
| --- | --- | --- |
| POST | `/tasks` | Görev ekler, `201` döner. |
| GET | `/tasks` | Tüm görevleri listeler, `200` döner. |
| GET | `/tasks/:kimlik` | Görev detayını getirir, `200` döner. |
| PUT | `/tasks/:kimlik` | Gönderilen alanları günceller, `200` döner. |
| DELETE | `/tasks/:kimlik` | Görevi siler, gövdesiz `204` döner. |

POST ve PUT isteklerinde `Content-Type: application/json` seçin. Örnek görev:

```json
{
  "title": "Görev API'sini hazırla",
  "description": "Görev ekleme ve listeleme uçlarını geliştir.",
  "priority": "high",
  "assignee": "Abdullah"
}
```

`title`, `description`, `priority` ve `assignee` oluşturma sırasında zorunludur. Öncelik `low`, `medium` veya `high`; durum `pending`, `in_progress` veya `completed` olabilir. Durum gönderilmezse `pending` atanır. Metin alanları boş olamaz ve en fazla 2000 karakter olabilir.

Yanıtta sunucunun oluşturduğu `id`, `createdAt` ve `updatedAt` alanları da bulunur. Detay, güncelleme ve silme için bu `id` değerini adrese ekleyin. PUT, yalnızca gönderilen alanları değiştirir; örneğin `{"status":"completed"}` görevi tamamlar. Kimlik ve zaman bilgileri istemci tarafından değiştirilemez.

Geçersiz veri veya bozuk JSON için `400`, bulunamayan görev/adres için `404`, 32 KB sınırını aşan gövde için `413` döner. Hatalar `{"mesaj":"Açıklama"}` biçimindedir.

## Test ve Postman

```bash
npm test
```

Otomatik test, geçici bir veri dosyasında CRUD, yeniden başlatma sonrası kalıcılık ve hata senaryolarını kontrol eder. Projenin görev dosyasını değiştirmez.

Postman için [koleksiyonu](postman/gorev_yonetimi.postman_collection.json) **Import → Files** ile içe aktarın. Sunucu açıkken koleksiyondaki istekleri numara sırasıyla çalıştırın veya Collection Runner kullanın. `temelAdres` varsayılan olarak `http://localhost:3000` değerindedir. Ekleme isteği, dönen kimliği sonraki isteklere otomatik aktarır. Koleksiyonu başka bir sunucuda çalıştırırsanız adresi değiştirin.

Test senaryoları ve Postman ekran görüntüleri [test belgesinde](belgeler/testler.md) yer alır.

## Dosya düzeni

- `sunucu.js`: Port ayarı ve sunucuyu başlatma.
- `uygulama.js`: Express kurulumu, rotalar ve hata yanıtları.
- `rotalar/gorevler.js`: Görev işlemleri ve temel veri kontrolleri.
- `ara_katmanlar/istek_kaydi.js`: İstek kayıtları.
- `ara_katmanlar/gorev_dogrulama.js`: Ekleme ve güncelleme verilerini denetler.
- `rotalar/raporlar.js`: Görev sayılarını raporlar.
- `veriler/gorev_deposu.js`: JSON okuma ve kaydetme.
- `veriler/gorevler.json`: Kalıcı görev listesi.
- `testler/`: Otomatik test.
- `belgeler/`: Proje tanıtımı, veri modeli, API, kullanım ve test belgeleri.
- `postman/`: İçe aktarılabilir test koleksiyonu.

Görevler JSON dosyasında tutulur. Uygulama tek sunucu süreciyle çalıştırılmalıdır; birden fazla süreç aynı dosyaya yazarsa veriler kaybolabilir.

## Gelişmiş kullanım

Durum ve öncelik filtresi, başlık/açıklama araması, çalışana göre listeleme, sayfalama ve sıralama desteklenir:

```text
GET /tasks?status=completed&priority=high
GET /tasks/search?keyword=backend
GET /tasks/assignee/musa
GET /tasks?page=1&limit=10&sort=-createdAt
GET /reports/completed
GET /reports/pending
GET /reports/summary
```

Sıralamada `-` azalan sırayı belirtir. Sayfalama yanıtı yine görev dizisidir; filtrelenen toplam görev sayısı `X-Total-Count` başlığındadır. Ayrıntılı istek/yanıt örnekleri [API belgesinde](belgeler/api.md), uygulamadan çağırma örneği [kullanım kılavuzunda](belgeler/kullanim_kilavuzu.md) bulunur.

