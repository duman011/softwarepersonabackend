# Taskflow — Proje Tanıtımı

## Amaç ve senaryo

Bir yazılım ekibindeki işlerin kime verildiğini, hangi öncelikte olduğunu ve tamamlanma durumunu takip etmek için görev yönetimi REST API'si geliştirilmiştir. Ekip sorumlusu yeni bir görev oluşturur, açıklamasını yazar ve görevi bir çalışana atar. Çalışma ilerledikçe görev bilgileri ve durumu güncellenir. Gereksiz görevler silinir.

Uygulama Node.js ve Express ile geliştirilmiştir. İstekler Postman üzerinden gönderilir ve yanıtlar JSON olarak alınır.

## Temel özellikler

- Başlık, açıklama, öncelik ve çalışan bilgisiyle görev oluşturma.
- Bütün görevleri listeleme ve kimlikle görev detayı görüntüleme.
- Görev bilgilerini, atanan çalışanı ve durumu güncelleme.
- Görev silme.
- Her isteğin HTTP yöntemini, adresini ve zamanını konsola kaydetme.
- Görevleri JSON dosyasında saklayarak yeniden başlatmada koruma.
- Eksik/geçersiz veri ve bulunamayan görevler için açıklayıcı hata yanıtları.
- Duruma ve önceliğe göre filtreleme, metin arama ve çalışan bazında listeleme.
- Sayfalama, artan/azalan sıralama ve görev sayısı raporları.

## Veri modeli

| Alan | Tür | Açıklama |
| --- | --- | --- |
| `id` | Metin | Sunucunun ürettiği benzersiz UUID. |
| `title` | Metin | Görev başlığı; zorunlu. |
| `description` | Metin | Görevin açıklaması; zorunlu. |
| `priority` | Metin | `low`, `medium` veya `high`; zorunlu. |
| `assignee` | Metin | Atanan çalışanın adı; zorunlu. |
| `status` | Metin | `pending`, `in_progress` veya `completed`; başlangıçta `pending`. |
| `createdAt` | Metin | Oluşturulma zamanı, ISO 8601/UTC. |
| `updatedAt` | Metin | Son güncelleme zamanı, ISO 8601/UTC. |

Veriler `veriler/gorevler.json` içinde bir dizi olarak tutulur. Çalışan adı doğrudan görevde saklanır; ayrı bir kullanıcı tablosu bulunmaz.

## API ve yapı

Ana kaynak `/tasks` adresidir. POST görev oluşturur, GET liste veya detay getirir, PUT gönderilen alanları günceller, DELETE siler. Ayrıntılar README'deki uç listesinde yer alır.

`sunucu.js` sunucuyu başlatır. `uygulama.js` istekleri ilgili rotaya yönlendirir. Görev işlemleri `rotalar/gorevler.js`, dosya okuma ve yazma işlemleri `veriler/gorev_deposu.js` içinde yer alır.

`ara_katmanlar/gorev_dogrulama.js` ekleme ve güncelleme isteklerini kontrol eder. Rapor uçları `rotalar/raporlar.js` içindedir.

## Test ve kapsam

Otomatik testler CRUD, kalıcılık, doğrulama, filtreleme, arama, sıralama, sayfalama ve raporları kontrol eder. Postman koleksiyonu 15 istek ve 30 kontrol içerir. Test ekran görüntüleri `belgeler/ekran_goruntuleri` klasöründedir.

