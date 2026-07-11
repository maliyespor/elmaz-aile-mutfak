# Aile Mutfak Programı

Eşinizle ortak kullanılan, buzdolabı/kiler/temizlik envanterini ve alışveriş listesini takip eden bir PWA.

## Kurulum (bir kere yapılır)

### 1. Firebase projesi

1. [console.firebase.google.com](https://console.firebase.google.com) adresinden yeni bir proje oluşturun.
2. **Build → Firestore Database** → "production mode" ile veritabanını oluşturun.
3. **Build → Authentication → Sign-in method** → **Google** sağlayıcısını etkinleştirin.
4. Proje ayarları (⚙️) → **Web app ekle** → verilen `firebaseConfig` değerlerini not edin.
5. Firestore → **Rules** sekmesine bu depodaki `firestore.rules` dosyasının içeriğini yapıştırıp yayımlayın.

### 2. Yerel geliştirme ortamı

```bash
npm install
cp .env.example .env   # sonra .env dosyasına Firebase config değerlerini yazın
npm run dev
```

### 3. İki eşin de hesabı görebilmesi

İlk giriş yapan kişi için uygulama otomatik olarak bir "hane" (household) oluşturur. İkinci eşin
aynı haneye eklenmesi için:

1. İkinci eş bir kere Google ile giriş yapar (uygulama kendine ait boş bir hane oluşturur).
2. Firebase konsolu → Firestore → `households` koleksiyonunda ilk eşin hane belgesini bulun.
3. İkinci eşin Authentication sekmesinden UID'sini kopyalayıp bu belgenin `members` dizisine ekleyin.
4. İkinci eşin kendi oluşturduğu (artık kullanılmayan) hane belgesini isteğe bağlı silebilirsiniz.

### 4. Firebase Hosting'e yayımlama

Site, Firebase Auth'un `authDomain`'i ile aynı alan adı ailesinde (`elmaz-aile-mutfak.web.app`)
barındırılıyor. Bu, GitHub Pages gibi farklı bir alan adında barındırmanın mobil tarayıcılarda
(özellikle Safari ve bazı Android Chrome sürümlerinde) Google girişini üçüncü taraf depolama
kısıtlamaları yüzünden sessizce bozabildiği sorunu ortadan kaldırır. Kod hâlâ GitHub'da tutulur;
sadece yayın hedefi GitHub Pages yerine Firebase Hosting'dir.

1. GitHub'da boş bir repo oluşturun ve bu projeyi push edin.
2. Repo **Settings → Secrets and variables → Actions** kısmına şu secret'ları ekleyin (Firebase config'inizden):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Firebase Console → Proje Ayarları (⚙️) → **Service accounts** sekmesi → **Generate new private key**
   ile bir JSON anahtar dosyası indirin. Bu dosyanın **tüm içeriğini** kopyalayıp repo →
   **Settings → Secrets and variables → Actions**'a `FIREBASE_SERVICE_ACCOUNT_ELMAZ_AILE_MUTFAK`
   adıyla yeni bir secret olarak ekleyin.
4. `main` dalına push edince `.github/workflows/deploy.yml` otomatik build alıp
   `https://elmaz-aile-mutfak.web.app` adresine yayımlar.

`elmaz-aile-mutfak.web.app` ve `elmaz-aile-mutfak.firebaseapp.com` adresleri Firebase tarafından
otomatik olarak yetkili alan adı (authorized domain) sayılır, ayrıca bir şey eklemenize gerek yok.

## Telefona kurulum

Yayımlanan adresi telefon tarayıcısında açıp "Ana ekrana ekle" seçeneğini kullanın; uygulama bir
simge olarak telefona kurulur (PWA).
