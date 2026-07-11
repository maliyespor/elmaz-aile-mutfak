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

### 4. GitHub Pages'e yayımlama

1. GitHub'da boş bir repo oluşturun ve bu projeyi push edin.
2. Repo **Settings → Pages → Source** kısmından **GitHub Actions**'ı seçin.
3. Repo **Settings → Secrets and variables → Actions** kısmına şu secret'ları ekleyin (Firebase config'inizden):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Firebase konsolu → Authentication → Settings → **Authorized domains** kısmına GitHub Pages
   adresinizi ekleyin (örn. `kullaniciadi.github.io`), yoksa Google girişi çalışmaz.
5. `main` dalına push edince `.github/workflows/deploy.yml` otomatik build alıp yayımlar.

## Telefona kurulum

Yayımlanan adresi telefon tarayıcısında açıp "Ana ekrana ekle" seçeneğini kullanın; uygulama bir
simge olarak telefona kurulur (PWA).
