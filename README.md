# n&e wallet

GitHub Pages için hazırlanmış n&e wallet yedeği.

## İçerik
- Nisu ve Erol kişi bazlı net durum / borç toplamları
- Mevcut görülebilen hesap bakiyeleri
- Mevcut görülebilen son harcamalar
- Kategori emojileri
- Kategori bazlı pasta grafik
- 12 pastel tema rengi
- Koyu tema
- Yeni harcama ekleme
- Borç toplamı düzenleme
- localStorage ile cihazda değişiklikleri saklama

## GitHub Pages
Dosyaları repository ana dizinine yükleyin.
Settings > Pages > Deploy from a branch > main / root seçin.

Not: Bu paket canlı ChatGPT Site projesinin erişilebilen görünür/veri projeksiyonundan yeniden oluşturulmuştur.
ChatGPT Site'in kapalı dahili kaynak deposu ve gizli backend kayıtları dışa aktarılamadığı için paket, erişilebilen verilerin tam çalışan statik GitHub sürümüdür.


## Firebase
Bu sürüm `ne-wallet-web` Firebase projesine bağlanır ve Firestore'da:
`wallets/shared-ne-wallet`
belgesini kullanır.

Firebase Console > Firestore Database bölümünden Firestore'u oluşturun.

İlk kurulum/test için Firestore Rules örneği:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wallets/{walletId} {
      allow read, write: if true;
    }
  }
}
```
UYARI: Bu test kuralı herkese açıktır. GitHub Pages herkese açık kalacaksa kalıcı kullanımda Authentication ile sınırlandırılmalıdır.
