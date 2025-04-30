# Toko Aplikasi Premium

Aplikasi web untuk toko aplikasi premium dengan fitur admin panel dan sistem pembayaran terintegrasi. Aplikasi ini memungkinkan pengguna untuk membeli aplikasi premium dengan berbagai metode pembayaran dan memberikan pengalaman berbelanja yang mudah dan aman.

## 🚀 Fitur Utama

- 📱 Katalog produk dengan tampilan responsif
- 👨‍💼 Admin panel untuk manajemen produk
- 🔐 Sistem autentikasi admin yang aman
- 💳 Integrasi pembayaran (QRIS, Bank Transfer)
- 🌓 Mode gelap/terang untuk kenyamanan pengguna
- 📊 Riwayat pembelian yang terorganisir
- ⭐ Sistem rating dan ulasan produk

## 🛠️ Teknologi yang Digunakan

### Frontend
- HTML5
- CSS3 (dengan fitur modern seperti Flexbox dan Grid)
- JavaScript (ES6+)
- Font Awesome untuk ikon
- Responsive Design

### Backend & Database
- Firebase Authentication
- Firebase Realtime Database
- Firebase Storage
- Firebase Analytics

## 🔥 Konfigurasi Firebase

### Langkah-langkah Setup Firebase

1. **Buat Proyek Firebase**
   - Buka [Firebase Console](https://console.firebase.google.com/)
   - Klik "Add project"
   - Masukkan nama proyek (contoh: "toko-aplikasi-premium")
   - Ikuti langkah-langkah setup proyek

2. **Tambahkan Firebase ke Web App**
   - Di Firebase Console, pilih proyek Anda
   - Klik ikon web (</>)
   - Daftarkan aplikasi dengan nama yang diinginkan
   - Salin konfigurasi Firebase yang diberikan

3. **Konfigurasi di Aplikasi**
   - Buka file `index.html`
   - Tambahkan script Firebase di bagian `<head>`:
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-analytics.js"></script>
   ```

4. **Inisialisasi Firebase**
   - Tambahkan kode inisialisasi di `index.html`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT_ID.firebasedatabase.app",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
     measurementId: "YOUR_MEASUREMENT_ID"
   };

   // Initialize Firebase
   firebase.initializeApp(firebaseConfig);
   firebase.analytics();
   ```

5. **Setup Authentication**
   - Di Firebase Console, buka Authentication
   - Aktifkan metode login Email/Password
   - Tambahkan admin user:
     ```javascript
     firebase.auth().createUserWithEmailAndPassword('admin@email.com', 'password')
       .then((userCredential) => {
         console.log('Admin user created');
       })
       .catch((error) => {
         console.error('Error creating admin:', error);
       });
     ```

6. **Setup Database Rules**
   - Di Firebase Console, buka Realtime Database
   - Tambahkan rules berikut:
   ```json
   {
     "rules": {
       ".read": true,
       "products": {
         ".write": "auth != null && auth.token.email == 'admin@email.com'"
       },
       "purchases": {
         ".write": true,
         ".read": "auth != null"
       }
     }
   }
   ```

### Struktur Database

```json
{
  "products": {
    "productId": {
      "name": "Nama Produk",
      "desc": "Deskripsi Produk",
      "price": 100000,
      "stock": 10,
      "img": "URL_Gambar",
      "rating": 4.5,
      "reviews": {
        "userId": {
          "rating": 5,
          "comment": "Komentar review"
        }
      }
    }
  },
  "purchases": {
    "purchaseId": {
      "userId": "user123",
      "productId": "product123",
      "quantity": 1,
      "totalPrice": 100000,
      "paymentMethod": "QRIS",
      "status": "pending",
      "timestamp": 1234567890
    }
  }
}
```

## 📁 Struktur Proyek

```
toko-aplikasi-premium/
├── index.html          # File HTML utama
├── style.css          # File CSS dengan styling    
├── script.js          # File JavaScript dengan logika aplikasi
└── README.md          # Dokumentasi proyek
```

## 🔒 Fitur Keamanan

- Autentikasi admin yang aman
- Validasi input dan sanitasi HTML
- Session timeout untuk keamanan
- Content Security Policy
- Proteksi terhadap XSS dan injeksi

## 💻 Fitur UI/UX

- Desain responsif untuk semua ukuran layar
- Animasi dan transisi yang smooth
- Loading states untuk feedback visual
- Error handling yang user-friendly
- Mode gelap/terang untuk kenyamanan mata

## 💳 Sistem Pembayaran

### Metode Pembayaran yang Didukung
- QRIS (Quick Response Code Indonesian Standard)
- Transfer Bank (BCA)
- Integrasi WhatsApp untuk konfirmasi pembayaran

### Fitur Pembayaran
- Pilihan metode pembayaran yang fleksibel
- Sistem konfirmasi pembayaran otomatis
- Riwayat transaksi yang terorganisir
- Notifikasi status pembayaran

## 👨‍💼 Admin Panel

### Fitur Manajemen Produk
- Tambah produk baru
- Edit informasi produk
- Hapus produk
- Manajemen stok
- Upload gambar produk

### Fitur Admin
- Dashboard admin yang intuitif
- Sistem autentikasi yang aman
- Manajemen pengaturan toko
- Monitoring transaksi

## 📱 Responsivitas

Aplikasi dioptimalkan untuk berbagai perangkat:
- Desktop (1920x1080 dan di atasnya)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)
- Landscape mode support

## 🚀 Instalasi

1. Clone repository ini
```bash
git clone https://github.com/[Erzambayu]/toko-aplikasi-premium.git
```

2. Buka file `index.html` di browser favorit Anda

## 💻 Penggunaan

### Admin Panel
1. Login menggunakan kredensial admin
2. Akses dashboard admin
3. Kelola produk:
   - Tambah produk baru
   - Edit informasi produk
   - Hapus produk
4. Atur pengaturan:
   - Nomor WhatsApp untuk pemesanan
   - Informasi pembayaran
   - Pengaturan umum

### Pembeli
1. Jelajahi katalog produk
2. Pilih produk yang diinginkan
3. Pilih metode pembayaran yang tersedia
4. Lakukan pemesanan via WhatsApp
5. Berikan rating dan ulasan setelah pembelian

## 🤝 Kontribusi

Kami menyambut kontribusi dari siapa saja! Berikut langkah-langkah untuk berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur/AmazingFeature`)
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin fitur/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](https://choosealicense.com/licenses/mit/)

## 📞 Kontak

Jika Anda memiliki pertanyaan atau saran, silakan buat issue di repository ini.

---

Dibuat dengan ❤️ oleh Tim Pengembang 