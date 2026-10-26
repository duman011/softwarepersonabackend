# API belgesi

Temel adres: `http://localhost:3000`. Yanıtlar JSON biçimindedir; silme yanıtı boş döner. Gövde gönderirken `Content-Type: application/json` kullanın. Kimlik yerine oluşturma yanıtındaki `id` değerini yazın.

## Görev oluşturma — POST /tasks

Örnek istek gövdesi:

```json
{
  "title": "Backend testi",
  "description": "Görev uçlarını dene.",
  "priority": "high",
  "assignee": "Musa"
}
```

Başarılı yanıt `201 Created` olur. `Location` başlığı görev adresini gösterir:

```json
{
  "id": "14c753e8-0359-4a81-aee0-a292994fd85e",
  "title": "Backend testi",
  "description": "Görev uçlarını dene.",
  "priority": "high",
  "assignee": "Musa",
  "status": "pending",
  "createdAt": "2026-10-26T10:00:00.000Z",
  "updatedAt": "2026-10-26T10:00:00.000Z"
}
```

Kimlik ve zamanlar sunucuda üretilir. `title`, `description`, `assignee` boş olmayan, en fazla 2000 karakterlik metinlerdir. `priority` zorunludur: `low`, `medium`, `high`. İsteğe bağlı `status`: `pending`, `in_progress`, `completed`; varsayılanı `pending`.

## Listeleme — GET /tasks

`GET /tasks` bütün görevleri `200` ile bir dizi içinde döndürür. Her eleman yukarıdaki görev nesnesidir. Sonuç yoksa `[]` döner.

| Parametre | Örnek | Davranış |
| --- | --- | --- |
| `status` | `/tasks?status=completed` | Durum tam eşleşmesi. |
| `priority` | `/tasks?priority=high` | Öncelik tam eşleşmesi. |
| `keyword` | `/tasks?keyword=backend` | Başlık ve açıklamada metin araması. |
| `sort` | `/tasks?sort=createdAt` | Artan sıralama. Başına `-` eklenirse azalan. |
| `page`, `limit` | `/tasks?page=1&limit=10` | Sayfalama. |

Filtreler birlikte kullanılabilir: `/tasks?status=completed&priority=high&sort=-createdAt`.

Sıralama alanları: `createdAt`, `updatedAt`, `title`, `priority`, `status`, `assignee`. Öncelikler `low < medium < high` sırasındadır. Diğer alanlar metin olarak sıralanır. Sıralama verilmezse dosyadaki sıra korunur.

Sayfalama yalnızca `page` veya `limit` gönderilirse uygulanır; eksik olan parametre için `page=1`, `limit=10` kullanılır. İkisi de pozitif tam sayı olmalıdır; `limit` en fazla 100 olabilir. Toplam sonuç sayısı, sayfalama öncesinde filtrelenen kayıt sayısını veren `X-Total-Count` başlığındadır. Sayfa aralık dışında kalırsa `[]` döner.

Örnek: `GET /tasks?page=1&limit=1` → `200`, `X-Total-Count: 1`, gövdede bir görevden oluşan dizi.

## Arama — GET /tasks/search?keyword=backend

Başlık ve açıklamada Türkçe büyük/küçük harf duyarsız arama yapar. `keyword` zorunludur; boş veya 2000 karakterden uzun olamaz. Yanıt `200` ve eşleşen görev dizisidir. Diğer listeleme parametreleri de kullanılabilir.

Örnek: `/tasks/search?keyword=backend&priority=high` → yukarıdaki görev nesnesini içeren dizi.

## Çalışana göre listeleme — GET /tasks/assignee/musa

Çalışan adı Türkçe büyük/küçük harf duyarsız tam eşleşmeyle aranır. Yanıt `200` ve görev dizisidir. Eşleşme yoksa `[]` döner. Diğer listeleme parametreleri kullanılabilir.

Örnek: `/tasks/assignee/musa?status=pending` → Musa'ya atanmış bekleyen görevler.

## Detay — GET /tasks/:kimlik

Örnek: `GET /tasks/14c753e8-0359-4a81-aee0-a292994fd85e`. Başarılı yanıt `200` ve oluşturma örneğindeki tek görev nesnesidir. Kimlik bulunamazsa `404` döner.

## Güncelleme — PUT /tasks/:kimlik

Örnek gövde:

```json
{ "status": "completed", "priority": "medium" }
```

Yalnızca gönderilen alanlar değişir. `200` yanıtı güncellenen görev nesnesidir; örnekte `status` alanı `completed`, `priority` alanı `medium` olur. `updatedAt` yenilenir; `id` ve `createdAt` korunur. Boş gövde kabul edilmez. Oluşturmadaki alan kuralları güncellemede de geçerlidir.

## Silme — DELETE /tasks/:kimlik

Örnek: `DELETE /tasks/14c753e8-0359-4a81-aee0-a292994fd85e`. Görev silinirse `204 No Content` ve boş gövde döner. Aynı kimlikle sonraki GET veya DELETE isteği `404` döner.

## Raporlar

Bu uçlar parametre veya istek gövdesi gerektirmez. Yanıt kodları `200` olur.

| İstek | Örnek yanıt | Açıklama |
| --- | --- | --- |
| `GET /reports/completed` | `{"completed":1}` | Tamamlanan görev sayısı. |
| `GET /reports/pending` | `{"pending":2}` | Yalnızca `pending` durumundaki görevler. |
| `GET /reports/summary` | `{"total":4,"pending":2,"in_progress":1,"completed":1}` | Toplam ve durumlara göre sayılar. |

Veri yoksa bütün sayılar sıfırdır. Raporlar görevleri değiştirmez.

## Hatalar

| Kod | Durum | Örnek yanıt |
| --- | --- | --- |
| `400` | Eksik alan, hatalı değer/parametre, bozuk JSON | `{"mesaj":"title alanı boş olmayan bir metin olmalıdır."}` |
| `404` | Görev bulunamadı | `{"mesaj":"Görev bulunamadı."}` |
| `413` | İstek gövdesi 32 KB üzerinde | `{"mesaj":"İstek gövdesi 32 KB sınırını aşıyor."}` |
| `500` | Beklenmeyen dosya/sunucu hatası | `{"mesaj":"Sunucuda bir hata oluştu."}` |

Bilinmeyen görev alanları, bilinmeyen listeleme parametreleri ve tekrarlanan parametreler reddedilir. Örnek: `/tasks?page=0` veya `/tasks?status=pending&status=completed` → `400`.
