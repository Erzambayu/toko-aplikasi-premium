// ============================================
// ADMIN PANEL — Dedicated Page Script
// Toko Aplikasi Premium 2025
// ============================================

// --- Firebase Instances ---
const auth = firebase.auth();
const database = firebase.database();

// --- Constants ---
const ADMIN_EMAIL = 'erzambayu@gmail.com';

// Self-contained fallback image (dark placeholder with icon) — no external dependency
const FALLBACK_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">' +
  '<rect width="300" height="300" fill="#1a1a2e"/>' +
  '<g fill="none" stroke="#c9a227" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="95" y="95" width="110" height="110" rx="12"/>' +
  '<circle cx="125" cy="125" r="8"/>' +
  '<path d="M95 185 L135 145 L160 170 L180 150 L205 175"/>' +
  '</g></svg>'
);

// --- State ---
let products = [];
let filteredProducts = [];
let currentPage = 'dashboard';

// ============================================
// UTILITIES
// ============================================

function sanitizeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

function formatPriceShort(price) {
  if (price >= 1000000) return 'Rp ' + (price / 1000000).toFixed(1) + 'jt';
  if (price >= 1000) return 'Rp ' + (price / 1000).toFixed(0) + 'rb';
  return 'Rp ' + price;
}

function validateProductData(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 3) errors.push("Nama aplikasi minimal 3 karakter");
  if (!data.desc || data.desc.trim().length < 10) errors.push("Deskripsi minimal 10 karakter");
  if (isNaN(data.stock) || data.stock < 0) errors.push("Stok harus berupa angka positif");
  if (isNaN(data.price) || data.price < 0) errors.push("Harga harus berupa angka positif");
  if (!data.img || !data.img.trim()) {
    errors.push("Link gambar tidak boleh kosong");
  } else {
    try { new URL(data.img); } catch (e) { errors.push("Link gambar harus berupa URL yang valid"); }
  }
  return errors;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toastContainer');
  },

  show(type, title, message, duration = 4000) {
    if (!this.container) this.init();
    const icons = {
      success: 'fa-check', error: 'fa-xmark',
      info: 'fa-info', warning: 'fa-triangle-exclamation'
    };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
      <div class="toast-body">
        <div class="toast-title">${sanitizeHTML(title)}</div>
        <div class="toast-message">${sanitizeHTML(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close"><i class="fas fa-xmark"></i></button>
      <div class="toast-progress" style="width: 100%;"></div>
    `;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    const progress = toast.querySelector('.toast-progress');
    progress.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { progress.style.width = '0%'; }));
    toast.querySelector('.toast-close').addEventListener('click', () => this.dismiss(toast));
    const timer = setTimeout(() => this.dismiss(toast), duration);
    toast._timer = timer;
    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    clearTimeout(toast._timer);
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  },

  success(t, m) { return this.show('success', t, m); },
  error(t, m) { return this.show('error', t, m, 5000); },
  info(t, m) { return this.show('info', t, m); },
  warning(t, m) { return this.show('warning', t, m); }
};

// ============================================
// CONFIRM DIALOG
// ============================================

function showConfirm(message, title = 'Konfirmasi') {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirmDialog');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    dialog.style.display = 'block';
    requestAnimationFrame(() => dialog.classList.add('show'));

    const cleanup = (result) => {
      dialog.classList.remove('show');
      setTimeout(() => { dialog.style.display = 'none'; }, 300);
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('click', onOverlay);
      resolve(result);
    };

    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onOverlay = (e) => { if (e.target === dialog) cleanup(false); };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('click', onOverlay);
  });
}

// ============================================
// THEME SYSTEM
// ============================================

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const isDark = theme === 'dark';
    btn.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;
    btn.title = isDark ? 'Light Mode' : 'Dark Mode';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0a0a0f' : '#f5f5f8';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============================================
// AUTH
// ============================================

auth.onAuthStateChanged((user) => {
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('adminDashboard');

  if (user && user.email === ADMIN_EMAIL) {
    // Authenticated
    loginScreen.style.display = 'none';
    dashboard.style.display = 'flex';
    document.getElementById('adminEmail').textContent = user.email;
    loadProducts();
  } else {
    if (user && user.email !== ADMIN_EMAIL) {
      auth.signOut();
      Toast.error('Akses Ditolak', 'Anda bukan admin.');
    }
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
  }
});

// ============================================
// PRODUCTS — LOAD & DISPLAY
// ============================================

async function loadProducts() {
  try {
    const snapshot = await database.ref('products').once('value');
    const data = snapshot.val();
    products = data
      ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
      : [];
    filteredProducts = [...products];

    updateDashboardStats();
    renderRecentProducts();
    renderProductsTable(filteredProducts);
  } catch (error) {
    Toast.error('Error', 'Gagal memuat produk: ' + error.message);
  }
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboardStats() {
  const total = products.length;
  const inStock = products.filter(p => (parseInt(p.stock) || 0) > 0).length;
  const outOfStock = products.filter(p => (parseInt(p.stock) || 0) <= 0).length;
  const totalValue = products.reduce((sum, p) => {
    return sum + ((parseInt(p.price) || 0) * (parseInt(p.stock) || 0));
  }, 0);

  document.getElementById('statTotalProducts').textContent = total;
  document.getElementById('statInStock').textContent = inStock;
  document.getElementById('statOutOfStock').textContent = outOfStock;
  document.getElementById('statTotalValue').textContent = formatPriceShort(totalValue);
}

function renderRecentProducts() {
  const container = document.getElementById('recentProducts');
  if (!container) return;

  const recent = products.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = '<p class="text-muted">Belum ada produk</p>';
    return;
  }

  container.innerHTML = recent.map(p => `
    <div class="recent-product-item">
      <img src="${sanitizeHTML(p.img || p.image || '')}" alt="${sanitizeHTML(p.name)}" onerror="this.src=FALLBACK_IMG">
      <div class="recent-product-info">
        <h4>${sanitizeHTML(p.name)}</h4>
        <span>Stok: ${p.stock || 0}</span>
      </div>
      <span class="recent-product-price">${formatPrice(p.price || 0)}</span>
    </div>
  `).join('');
}

// ============================================
// PRODUCTS TABLE
// ============================================

function renderProductsTable(list) {
  const tbody = document.getElementById('productsTableBody');
  const empty = document.getElementById('productsEmpty');
  const table = document.getElementById('productsTable');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!list || list.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  table.style.display = '';
  empty.style.display = 'none';

  list.forEach(p => {
    const stock = parseInt(p.stock) || 0;
    let stockClass = 'in-stock';
    if (stock <= 0) stockClass = 'out-of-stock';
    else if (stock <= 5) stockClass = 'low-stock';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img class="table-product-img" src="${sanitizeHTML(p.img || p.image || '')}" alt="${sanitizeHTML(p.name)}" onerror="this.src=FALLBACK_IMG"></td>
      <td><span class="table-product-name">${sanitizeHTML(p.name)}</span></td>
      <td><span class="table-price">${formatPrice(p.price || 0)}</span></td>
      <td><span class="table-stock ${stockClass}">${stock}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" data-id="${p.id}"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-delete" data-id="${p.id}"><i class="fas fa-trash"></i> Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================
// PRODUCT FORM (Add/Edit)
// ============================================

function resetForm() {
  document.getElementById('productForm').reset();
  document.getElementById('editIndex').value = '';
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Produk Baru';
  document.getElementById('submitBtnText').textContent = 'Simpan Produk';
  document.getElementById('imagePreviewGroup').style.display = 'none';
}

function editProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('appName').value = product.name || '';
  document.getElementById('appDesc').value = product.desc || '';
  document.getElementById('appStock').value = product.stock || 0;
  document.getElementById('appPrice').value = product.price || 0;
  document.getElementById('appImg').value = product.img || product.image || '';
  document.getElementById('editIndex').value = product.id;
  document.getElementById('formTitle').innerHTML = '<i class="fas fa-pen-to-square"></i> Edit Produk';
  document.getElementById('submitBtnText').textContent = 'Update Produk';

  // Show image preview
  const imgUrl = product.img || product.image || '';
  if (imgUrl) {
    document.getElementById('imagePreview').src = imgUrl;
    document.getElementById('imagePreviewGroup').style.display = 'block';
  }

  // Navigate to add-product page
  navigateTo('add-product');
}

async function deleteProduct(productId) {
  const confirmed = await showConfirm('Yakin ingin menghapus produk ini?', 'Hapus Produk');
  if (!confirmed) return;

  try {
    await database.ref('products/' + productId).remove();
    Toast.success('Berhasil', 'Produk berhasil dihapus!');
    loadProducts();
  } catch (error) {
    Toast.error('Gagal', 'Gagal menghapus produk: ' + error.message);
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('appName').value.trim(),
    desc: document.getElementById('appDesc').value.trim(),
    stock: parseInt(document.getElementById('appStock').value),
    price: parseInt(document.getElementById('appPrice').value),
    img: document.getElementById('appImg').value.trim(),
    image: document.getElementById('appImg').value.trim()
  };

  const errors = validateProductData(data);
  if (errors.length > 0) {
    Toast.error('Validasi Gagal', errors.join(', '));
    return;
  }

  try {
    const productId = document.getElementById('editIndex').value;
    if (productId) {
      await database.ref('products/' + productId).set(data);
      Toast.success('Berhasil', 'Produk berhasil diperbarui!');
    } else {
      await database.ref('products').push(data);
      Toast.success('Berhasil', 'Produk berhasil ditambahkan!');
    }
    resetForm();
    navigateTo('products');
    loadProducts();
  } catch (error) {
    Toast.error('Gagal', 'Gagal menyimpan produk: ' + error.message);
  }
}

// ============================================
// NAVIGATION
// ============================================

function navigateTo(page) {
  currentPage = page;

  // Update sidebar active state
  document.querySelectorAll('.sidebar-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Show/hide pages
  document.querySelectorAll('.admin-page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });

  // Update page title
  const titles = {
    'dashboard': 'Dashboard',
    'products': 'Daftar Produk',
    'add-product': document.getElementById('editIndex').value ? 'Edit Produk' : 'Tambah Produk'
  };
  document.getElementById('pageTitle').textContent = titles[page] || 'Admin';

  // Close sidebar on mobile
  closeSidebar();
}

// ============================================
// SIDEBAR (mobile)
// ============================================

let sidebarOverlay = null;

function openSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  sidebar.classList.add('open');

  if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    sidebarOverlay.addEventListener('click', closeSidebar);
    document.body.appendChild(sidebarOverlay);
  }
  sidebarOverlay.style.display = 'block';
  requestAnimationFrame(() => sidebarOverlay.classList.add('show'));
}

function closeSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  sidebar.classList.remove('open');

  if (sidebarOverlay) {
    sidebarOverlay.classList.remove('show');
    setTimeout(() => {
      if (sidebarOverlay) sidebarOverlay.style.display = 'none';
    }, 300);
  }
}

// ============================================
// SEARCH (admin products)
// ============================================

function initAdminSearch() {
  const input = document.getElementById('adminSearchInput');
  if (!input) return;

  const doSearch = debounce(() => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      filteredProducts = [...products];
    } else {
      filteredProducts = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.desc || p.description || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
      });
    }
    renderProductsTable(filteredProducts);
  }, 250);

  input.addEventListener('input', doSearch);
}

// ============================================
// IMAGE PREVIEW
// ============================================

function initImagePreview() {
  const imgInput = document.getElementById('appImg');
  if (!imgInput) return;

  imgInput.addEventListener('input', debounce(() => {
    const url = imgInput.value.trim();
    const previewGroup = document.getElementById('imagePreviewGroup');
    const preview = document.getElementById('imagePreview');

    if (url) {
      try {
        new URL(url);
        preview.src = url;
        preview.onerror = () => { previewGroup.style.display = 'none'; };
        preview.onload = () => { previewGroup.style.display = 'block'; };
      } catch (e) {
        previewGroup.style.display = 'none';
      }
    } else {
      previewGroup.style.display = 'none';
    }
  }, 500));
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    try {
      await auth.signInWithEmailAndPassword(email, password);
      if (email !== ADMIN_EMAIL) {
        auth.signOut();
        errorEl.textContent = 'Akses ditolak. Anda bukan admin.';
      }
    } catch (error) {
      errorEl.textContent = 'Email atau password salah!';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    const confirmed = await showConfirm('Yakin ingin logout?', 'Logout');
    if (confirmed) {
      auth.signOut();
      Toast.info('Logout', 'Anda telah keluar');
    }
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Sidebar navigation
  document.querySelectorAll('.sidebar-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Sidebar toggle (mobile)
  document.getElementById('sidebarToggle').addEventListener('click', openSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);

  // Go to add product from products page
  document.getElementById('goToAddProduct').addEventListener('click', () => {
    resetForm();
    navigateTo('add-product');
  });

  // Product form
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);

  // Cancel form
  document.getElementById('cancelForm').addEventListener('click', () => {
    resetForm();
    navigateTo('products');
  });

  // Products table — event delegation for edit/delete
  document.getElementById('productsTableBody').addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) editProduct(editBtn.dataset.id);
    if (deleteBtn) deleteProduct(deleteBtn.dataset.id);
  });

  // Keyboard: Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
      const confirmDialog = document.getElementById('confirmDialog');
      if (confirmDialog.classList.contains('show')) {
        document.getElementById('confirmCancel').click();
      }
    }
  });

  // Init sub-systems
  initAdminSearch();
  initImagePreview();
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  Toast.init();
  setupEventListeners();
});
