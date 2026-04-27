# Toko Aplikasi Premium

[![GitHub](https://img.shields.io/badge/GitHub-toko--aplikasi--premium-blue?logo=github)](https://github.com/Erzambayu/toko-aplikasi-premium)
[![Website](https://img.shields.io/badge/Website-toko--aplikasi--premium-green?logo=google-chrome)](https://erzambayu.net/toko-aplikasi-premium/)

---

> **Aplikasi web toko aplikasi premium** dengan admin panel, sistem pembayaran terintegrasi, dan pengalaman belanja yang mudah & aman.

---

## ✨ Fitur Utama

| Fitur                        | Deskripsi                                                      |
|------------------------------|----------------------------------------------------------------|
| 📱 Katalog Produk            | Tampilan responsif, mudah dijelajahi                           |
| 👨‍💼 Admin Panel              | Manajemen produk, stok, dan transaksi                          |
| 🔐 Autentikasi Admin         | Sistem login aman                                              |
| 💳 Pembayaran Terintegrasi   | QRIS, Transfer Bank, WhatsApp                                  |
| 🌓 Mode Gelap/Terang         | Nyaman untuk mata, bisa diubah                                 |
| 📊 Riwayat Pembelian         | Semua transaksi tercatat rapi                                  |
| ⭐ Rating & Ulasan           | Pengguna bisa memberi review                                   |

---

## 🛠️ Teknologi

**Frontend:**  
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) ![Font Awesome](https://img.shields.io/badge/Font%20Awesome-339AF0?logo=fontawesome&logoColor=white)

**Backend & Database:**  
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)

---

## 🚀 Instalasi Cepat

1. **Clone repository**
   ```bash
   git clone https://github.com/Erzambayu/toko-aplikasi-premium.git
   ```
2. **Buka** `index.html` di browser favorit Anda

---

## 🔥 Setup & Konfigurasi Firebase

<details>
<summary>Klik untuk detail setup Firebase</summary>

1. **Buat Proyek Firebase**
   - Buka [Firebase Console](https://console.firebase.google.com/)
   - Ikuti langkah-langkah pembuatan proyek
2. **Tambahkan Firebase ke Web App**
   - Pilih ikon web (</>) dan salin konfigurasi
3. **Tambahkan script Firebase di `<head>` `index.html`**
   ```html
   <!-- Firebase SDK -->
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
   <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-analytics.js"></script>
   ```
4. **Inisialisasi Firebase**
   ```js
   const firebaseConfig = { /* ... */ };
   firebase.initializeApp(firebaseConfig);
   firebase.analytics();
   ```
5. **Aktifkan Authentication** (Email/Password) & buat admin user
6. **Atur Database Rules**
   ```json
   {
     "rules": {
       ".read": true,
       "products": { ".write": "auth != null && auth.token.email == 'admin@email.com'" },
       "purchases": { ".write": true, ".read": "auth != null" }
     }
   }
   ```
7. **Struktur Database**
   ```json
   {
     "products": { ... },
     "purchases": { ... }
   }
   ```
</details>

---

## 📁 Struktur Proyek

```
toko-aplikasi-premium/
├── index.html      # HTML utama
├── style.css       # Styling CSS
├── script.js       # Logika aplikasi
└── README.md       # Dokumentasi
```

---

## 💳 Sistem Pembayaran

- **QRIS (QR Code Indonesia Standard)**
- **Transfer Bank (BCA)**
- **Konfirmasi via WhatsApp**
- Riwayat & notifikasi status pembayaran

---

## 👨‍💼 Admin Panel

- Tambah/edit/hapus produk
- Manajemen stok & upload gambar
- Monitoring transaksi & pengaturan toko

---

## 🔒 Keamanan

- Autentikasi admin aman
- Validasi & sanitasi input
- Session timeout
- Content Security Policy
- Proteksi XSS & injeksi

---

## 💻 Fitur UI/UX

- Desain responsif (desktop, tablet, mobile)
- Animasi & transisi smooth
- Loading states & error handling user-friendly
- Mode gelap/terang

---

## 🤝 Kontribusi

1. Fork repository
2. Buat branch baru (`git checkout -b fitur/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin fitur/AmazingFeature`)
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](https://choosealicense.com/licenses/mit/)

---

## 📞 Kontak

Jika ada pertanyaan/saran, silakan buat issue di repository ini.

---

Dibuat dengan ❤️ oleh Tim Pengembang 
