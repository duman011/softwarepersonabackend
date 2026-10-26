# Kullanım kılavuzu

1. Proje klasöründe `npm ci` ve ardından `npm start` çalıştırın.
2. Postman'da **Import** ile `postman/gorev_yonetimi.postman_collection.json` dosyasını seçin.
3. Koleksiyonun `temelAdres` değişkenini `http://localhost:3000` olarak bırakın. Farklı port kullanıyorsanız değiştirin.
4. `01 - Görev ekle` isteğini gönderin. Oluşturulan kimlik `gorevKimligi` değişkenine otomatik kaydedilir.
5. Listeleme, detay, güncelleme ve `04a`–`04i` gelişmiş isteklerini sırayla çalıştırın.
6. Son olarak silme ve silinen görevi sorgulama isteklerini çalıştırın. Collection Runner tüm akışı otomatik yürütür; bittiğinde oluşturulan görev silinmiş olur.

Silinen görevin detayını sorgulamak `404` döndürür. Listelemede eşleşen görev yoksa yanıt `[]` olur.

## Başka bir uygulamadan çağırma

Node.js içinde aşağıdaki örnek bir görev oluşturur. Sunucu açık olmalıdır:

```javascript
async function gorevEkle() {
  const yanit = await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Entegrasyon testi',
      description: 'Uygulamadan görev oluştur.',
      priority: 'medium',
      assignee: 'Abdullah'
    })
  });
  const sonuc = await yanit.json();
  if (!yanit.ok) throw new Error(sonuc.mesaj);
  console.log('Görev kimliği:', sonuc.id);
}

gorevEkle().catch((hata) => console.error(hata.message));
```

Dönen `id` değerini `/tasks/:kimlik` adresinde kullanarak detaya ulaşabilir, PUT ile güncelleyebilir veya DELETE ile silebilirsiniz. Arama kelimesini ya da çalışan adını URL'ye eklerken `encodeURIComponent` kullanın.

Bu örnek sunucu tarafı içindir. Farklı bir origin üzerinde çalışan tarayıcı arayüzü bağlanacaksa o arayüzün adresi için ayrıca CORS ayarı gerekir. API'de kullanıcı girişi bulunmaz; internet üzerinde kimlik doğrulaması gerektiren kullanım için hazır değildir.
