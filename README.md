# Toko Aplikasi Premium

[![GitHub](https://img.shields.io/badge/GitHub-toko--aplikasi--premium-blue?logo=github)](https://github.com/Erzambayu/toko-aplikasi-premium)
[![Website](https://img.shields.io/badge/Live-erzambayu.github.io-green?logo=google-chrome)](https://erzambayu.github.io/toko-aplikasi-premium/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

> Toko online aplikasi premium dengan dark premium theme, admin dashboard terpisah, dan checkout via WhatsApp.

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| Katalog Produk | Grid responsif dengan skeleton loading & scroll animations |
| Search & Filter | Pencarian real-time dengan debounce |
| Admin Dashboard | Halaman terpisah (`admin.html`) dengan sidebar, stats, dan CRUD produk |
| Autentikasi | Firebase Auth — hanya admin yang bisa akses dashboard |
| Pembayaran | QRIS & Transfer BCA, konfirmasi via WhatsApp |
| Dark/Light Mode | Dark premium (default) dengan gold accents, light mode tersedia |
| Riwayat Pembelian | Disimpan di localStorage |
| Toast Notifications | Menggantikan `alert()` dan `confirm()` bawaan browser |
| Bottom Navigation | Navigasi mobile-friendly di bagian bawah layar |
| Deskripsi Smart | Auto-format emoji jadi bullet points, expand/collapse |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | HTML5, CSS3 (Custom Properties), Vanilla JS (ES6+) |
| Font | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |
| Icons | [Font Awesome 6.5](https://fontawesome.com/) |
| Backend | [Firebase 8.10](https://firebase.google.com/) (Realtime Database, Auth, Analytics) |
| Hosting | [GitHub Pages](https://pages.github.com/) |
| Payment | WhatsApp API, QRIS, Transfer BCA |

---

## Struktur Proyek

```
toko-aplikasi-premium/
├── index.html       # Storefront — katalog produk & checkout
├── admin.html       # Admin dashboard — login, CRUD, stats
├── style.css        # Shared styles — dark premium theme
├── admin.css        # Admin-specific styles — sidebar, table, form
├── script.js        # Storefront logic — products, search, checkout
├── admin.js         # Admin logic — auth, CRUD, navigation
├── README.md        # Dokumentasi
└── LICENSE          # MIT License
```

---

## Quick Start

```bash
git clone https://github.com/Erzambayu/toko-aplikasi-premium.git
```

Buka `index.html` di browser. Tidak perlu build tools atau npm.

---

## Firebase Setup

<details>
<summary>Klik untuk detail konfigurasi</summary>

1. Buat proyek di [Firebase Console](https://console.firebase.google.com/)
2. Tambahkan web app dan salin konfigurasi
3. Aktifkan **Authentication** (Email/Password)
4. Buat user admin dengan email yang sesuai `ADMIN_EMAIL` di `script.js` dan `admin.js`
5. Buat **Realtime Database** dengan rules:

```json
{
  "rules": {
    ".read": true,
    "products": {
      ".write": "auth != null && auth.token.email == 'erzambayu@gmail.com'"
    }
  }
}
```

6. Ganti `firebaseConfig` di `index.html` dan `admin.html` dengan config proyek kamu

</details>

---

## Pembayaran

- **QRIS** — scan QR code dari e-wallet atau mobile banking
- **Transfer BCA** — nomor rekening dengan tombol copy
- **Konfirmasi** — redirect ke WhatsApp dengan detail pesanan otomatis

---

## Admin Dashboard

Akses via `admin.html` atau klik icon shield di header/bottom nav.

- **Dashboard** — total produk, stok tersedia, stok habis, total nilai stok
- **Daftar Produk** — tabel dengan search, edit, hapus
- **Tambah/Edit Produk** — form dengan image preview
- **Responsive sidebar** — collapse di mobile, overlay navigation

---

## Keamanan

- Firebase Auth untuk admin access
- Input sanitization (XSS protection)
- `noindex, nofollow` pada halaman admin
- Event listener management tanpa duplikasi
- Content Security Policy headers

---

## Lisensi

[MIT License](LICENSE) — Copyright 2025 Erzam Bayu

---

Dibuat oleh [Erzam Bayu](https://github.com/Erzambayu)
