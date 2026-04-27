// ============================================
// TOKO APLIKASI PREMIUM — Storefront Script
// Dark Premium Edition — 2025
// ============================================

// --- Domain Redirect ---
if (location.hostname === "erzambayu.me") {
  window.location.replace("https://erzambayu.com" + location.pathname);
}

// --- Firebase Instances ---
const auth = firebase.auth();
const database = firebase.database();
const analytics = firebase.analytics();

// --- State ---
let products = [];
let filteredProducts = [];
let currentProduct = null;
let purchaseHistory = [];
const waNumber = '6285156545003';

// Load purchase history
try {
  purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
} catch (e) {
  purchaseHistory = [];
}

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

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================
// DESCRIPTION FORMATTER
// ============================================

function formatDescription(raw) {
  if (!raw) return '';

  let text = raw;

  // Strip common prefixes like "Deskripsi Produk:", "Deskripsi:", etc.
  text = text.replace(/^[\s\S]*?Deskripsi\s*(?:Produk)?\s*:\s*/i, '');

  // Common emoji set used as bullet markers
  const emojiPattern = /([✨🔥✅🎮🌐🔒✔️📱💻🎨🖌️💡🎬📸🎵🎶⚡🛡️🏆💎🚀📦🔑💰🎁📌⭐🌟💫🔔📢🎯💪🤖🧠📊📈🔧⚙️🎭🎪🎨🖥️📲💬🔗📋🎉🎊💥🌈🔥🏅🎖️🥇🥈🥉🏆🎗️🎫🎟️🎪🎠🎡🎢🎃🎄🎆🎇🧨✨🎈🎉🎊🎋🎍🎎🎏🎐🎑🧧🎀🎁🎗️🎞️🎟️🎫🎖️🏅🥇🥈🥉🏆⚽⚾🥎🏀🏐🏈🏉🎾🥏🎳🏏🏑🏒🥍🏓🏸🥊🥋🥅⛳⛸️🎣🤿🎽🎿🛷🥌🎯🪀🪁🎱🔮🧿🎮🕹️🎰🎲🧩🧸🪅🪆♠️♥️♦️♣️♟️🃏🀄🎴🎭🖼️🎨🧵🪡🧶🪢])/gu;

  // Replace emoji followed by text as bullet items
  // First, add newlines before emojis that act as bullet points
  text = text.replace(new RegExp(`(${emojiPattern.source})\\s*`, 'gu'), '\n$1 ');

  // Also handle dash-style bullets
  text = text.replace(/ - /g, '\n• ');
  text = text.replace(/^- /gm, '• ');

  // Handle "◆" or "◇" or "●" or "►" markers
  text = text.replace(/[◆◇●►▸▹▪▫■□]\s*/g, '\n• ');

  // Clean up multiple newlines
  text = text.replace(/\n{2,}/g, '\n');

  // Trim and clean
  text = text.trim();

  // Split into lines and filter empty
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length <= 1) {
    // Single line — just return as-is
    return sanitizeHTML(text);
  }

  // Build HTML: first line as summary, rest as details
  const firstLine = sanitizeHTML(lines[0]);
  const restLines = lines.slice(1).map(l => sanitizeHTML(l));

  return `<span class="desc-summary">${firstLine}</span><span class="desc-details">${restLines.join('<br>')}</span>`;
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
// SKELETON LOADING
// ============================================

function showSkeleton() {
  const catalog = document.getElementById('catalog');
  if (!catalog) return;
  let html = '';
  for (let i = 0; i < 6; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line w-60 h-lg"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line h-btn"></div>
        </div>
      </div>
    `;
  }
  catalog.className = 'skeleton-grid';
  catalog.innerHTML = html;
}

function hideSkeleton() {
  const catalog = document.getElementById('catalog');
  if (catalog) {
    catalog.className = 'catalog';
    catalog.innerHTML = '';
  }
}

// ============================================
// PRODUCT LOADING & DISPLAY
// ============================================

async function loadProducts() {
  try {
    showSkeleton();
    const snapshot = await database.ref('products').once('value');
    const data = snapshot.val();
    products = data
      ? Object.entries(data).map(([key, value]) => ({ id: key, ...value }))
      : [];
    filteredProducts = [...products];
    hideSkeleton();
    displayProducts(filteredProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    hideSkeleton();
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-wifi" style="color: var(--error);"></i>
          <h3>Gagal memuat produk</h3>
          <p>${sanitizeHTML(error.message)}</p>
        </div>
      `;
    }
  }
}

function displayProducts(list) {
  const catalog = document.getElementById('catalog');
  const emptyState = document.getElementById('emptyState');
  if (!catalog) return;

  catalog.innerHTML = '';

  if (!list || list.length === 0) {
    catalog.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  catalog.style.display = '';
  if (emptyState) emptyState.style.display = 'none';

  list.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'card';

    const name = sanitizeHTML(product.name || '');
    const rawDesc = product.desc || product.description || '';
    const formattedDesc = formatDescription(rawDesc);
    const img = sanitizeHTML(product.img || product.image || 'https://via.placeholder.com/300');
    const stock = parseInt(product.stock) || 0;
    const price = Number(product.price) || 0;

    let stockClass = 'in-stock';
    let stockText = `Stok: ${stock}`;
    if (stock <= 0) { stockClass = 'out-of-stock'; stockText = 'Habis'; }
    else if (stock <= 5) { stockClass = 'low-stock'; stockText = `Sisa ${stock}`; }

    // Show toggle if description is long enough (>80 chars)
    const isLongDesc = rawDesc.length > 80;

    card.innerHTML = `
      <div class="card-header">
        <img src="${img}" alt="${name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300'">
      </div>
      <div class="card-content">
        <h3>${name}</h3>
        <div class="card-desc">${formattedDesc}</div>
        ${isLongDesc ? '<button class="desc-toggle" onclick="toggleDesc(this)" aria-label="Toggle description"><span>Selengkapnya</span> <i class="fas fa-chevron-down"></i></button>' : ''}
        <div class="card-meta">
          <span class="card-stock ${stockClass}">${stockText}</span>
          <span class="card-price">${formatPrice(price)}</span>
        </div>
      </div>
      <div class="card-action">
        <button class="btn-buy" onclick="buyProduct('${product.id}')" ${stock <= 0 ? 'disabled' : ''}>
          <i class="fab fa-whatsapp"></i>
          ${stock <= 0 ? 'Stok Habis' : 'Beli Sekarang'}
        </button>
      </div>
    `;

    catalog.appendChild(card);
  });

  observeCards();
}

// Toggle description expand/collapse
window.toggleDesc = function(btn) {
  const card = btn.closest('.card-content');
  const desc = card ? card.querySelector('.card-desc') : null;
  if (!desc) return;

  const isExpanded = desc.classList.contains('expanded');
  desc.classList.toggle('expanded');
  btn.classList.toggle('expanded');

  const label = btn.querySelector('span');
  if (isExpanded) {
    label.textContent = 'Selengkapnya';
  } else {
    label.textContent = 'Sembunyikan';
  }
};

// ============================================
// SCROLL ANIMATIONS
// ============================================

let cardObserver = null;

function observeCards() {
  if (cardObserver) cardObserver.disconnect();
  const cards = document.querySelectorAll('.card:not(.visible)');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    cards.forEach(c => c.classList.add('visible'));
    return;
  }

  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  cards.forEach(card => cardObserver.observe(card));
}

// ============================================
// SEARCH / FILTER
// ============================================

function initSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  if (!input) return;

  const doSearch = debounce(() => {
    const query = input.value.trim().toLowerCase();
    clearBtn.style.display = query ? 'flex' : 'none';

    if (!query) {
      filteredProducts = [...products];
      displayProducts(filteredProducts);
      updateSearchStats('');
      return;
    }

    filteredProducts = products.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.desc || p.description || '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });

    displayProducts(filteredProducts);
    updateSearchStats(query);
  }, 250);

  input.addEventListener('input', doSearch);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    updateSearchStats('');
    input.focus();
  });
}

function updateSearchStats(query) {
  const stats = document.getElementById('searchStats');
  if (!stats) return;
  stats.textContent = query
    ? `${filteredProducts.length} produk ditemukan untuk "${query}"`
    : '';
}

// ============================================
// CHECKOUT MODAL
// ============================================

function showCheckoutModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentProduct = product;
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  document.getElementById('checkout-product-id').value = product.id;
  document.getElementById('checkout-product-name').textContent = product.name || '';
  document.getElementById('checkout-product-desc').textContent = product.desc || product.description || '';
  document.getElementById('checkout-product-price').textContent = formatPrice(product.price);
  document.getElementById('checkout-product-stock').textContent = `Stok: ${product.stock}`;

  const img = document.getElementById('checkout-product-image');
  img.src = product.img || product.image || 'https://via.placeholder.com/300';
  img.onerror = function () { this.src = 'https://via.placeholder.com/300'; };

  document.getElementById('quantity').value = 1;
  document.getElementById('notes').value = '';
  document.getElementById('payment-qris').checked = true;
  document.getElementById('qris-info').style.display = 'block';
  document.getElementById('bca-info').style.display = 'none';

  updateTotalPrice();
  openModal(modal);
}

function closeCheckoutModal() {
  closeModal(document.getElementById('checkoutModal'));
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!currentProduct) return;

  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  const notes = document.getElementById('notes').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const totalPrice = currentProduct.price * quantity;

  addToPurchaseHistory({
    product: currentProduct, quantity, total: totalPrice, paymentMethod, notes
  });

  const msg = encodeURIComponent(
    `Halo, saya ingin membeli:\n\n` +
    `Produk: ${currentProduct.name}\n` +
    `Jumlah: ${quantity}\n` +
    `Total: ${formatPrice(totalPrice)}\n` +
    `Metode Pembayaran: ${paymentMethod}\n` +
    (notes ? `Catatan: ${notes}\n\n` : '\n') +
    `Mohon konfirmasi pesanan saya.`
  );

  window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
  closeCheckoutModal();
  Toast.success('Pesanan Dikirim', 'Silakan lanjutkan pembayaran di WhatsApp');
}

function updateTotalPrice() {
  if (!currentProduct) return;
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  document.getElementById('checkout-total-price').textContent = formatPrice(currentProduct.price * quantity);
}

// ============================================
// PURCHASE HISTORY
// ============================================

function addToPurchaseHistory(purchase) {
  purchase.date = new Date().toISOString();
  purchaseHistory.unshift(purchase);
  try { localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory)); } catch (e) {}
}

function showPurchaseHistory() {
  const existing = document.getElementById('historyModal');
  if (existing) existing.remove();

  const html = `
    <div id="historyModal" class="modal" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h2><i class="fas fa-clock-rotate-left"></i> Riwayat Pembelian</h2>
          <button class="modal-close" id="closeHistoryBtn"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="history-list">
            ${purchaseHistory.length === 0
              ? `<div class="history-empty"><i class="fas fa-receipt"></i><p>Belum ada riwayat pembelian</p></div>`
              : purchaseHistory.map(p => `
                <div class="history-item">
                  <div class="history-header">
                    <h3>${sanitizeHTML(p.product?.name || 'Produk')}</h3>
                    <span class="history-date">${new Date(p.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div class="history-details">
                    <p>Jumlah: ${p.quantity}</p>
                    <p>Total: ${formatPrice(p.total)}</p>
                    <p>Pembayaran: ${sanitizeHTML(p.paymentMethod)}</p>
                    ${p.notes ? `<p>Catatan: ${sanitizeHTML(p.notes)}</p>` : ''}
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const modal = document.getElementById('historyModal');
  openModal(modal);

  document.getElementById('closeHistoryBtn').addEventListener('click', () => closeModal(modal, true));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal, true); });
}

// ============================================
// MODAL HELPERS
// ============================================

function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeModal(modal, removeAfter = false) {
  if (!modal) return;
  modal.classList.remove('show');
  document.body.style.overflow = '';
  setTimeout(() => {
    modal.style.display = 'none';
    if (removeAfter) modal.remove();
  }, 300);
}

// ============================================
// CLIPBOARD
// ============================================

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    Toast.success('Disalin!', 'Nomor rekening berhasil disalin');
    return true;
  } catch (err) {
    Toast.error('Gagal', 'Gagal menyalin nomor rekening');
    return false;
  }
}

// ============================================
// BOTTOM NAVIGATION
// ============================================

function initBottomNav() {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const item = e.target.closest('.bottom-nav-item');
    if (!item || item.tagName === 'A') return; // skip <a> links (admin)

    const target = item.dataset.target;

    nav.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    switch (target) {
      case 'home':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'search':
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => searchInput.focus(), 400);
        }
        break;
      case 'history':
        showPurchaseHistory();
        break;
    }
  });
}

// ============================================
// PAYMENT METHOD TOGGLE
// ============================================

function initPaymentToggle() {
  const qrisRadio = document.getElementById('payment-qris');
  const bcaRadio = document.getElementById('payment-bca');
  const qrisInfo = document.getElementById('qris-info');
  const bcaInfo = document.getElementById('bca-info');

  if (qrisRadio && bcaRadio) {
    qrisRadio.addEventListener('change', () => {
      if (qrisRadio.checked) { qrisInfo.style.display = 'block'; bcaInfo.style.display = 'none'; }
    });
    bcaRadio.addEventListener('change', () => {
      if (bcaRadio.checked) { qrisInfo.style.display = 'none'; bcaInfo.style.display = 'block'; }
    });
  }
}

// ============================================
// QUANTITY CONTROLS
// ============================================

function initQuantityControls() {
  const decrease = document.getElementById('decreaseQuantity');
  const increase = document.getElementById('increaseQuantity');
  const input = document.getElementById('quantity');

  if (decrease && input) {
    decrease.addEventListener('click', () => {
      let val = parseInt(input.value) || 1;
      if (val > 1) { input.value = val - 1; updateTotalPrice(); }
    });
  }

  if (increase && input) {
    increase.addEventListener('click', () => {
      let val = parseInt(input.value) || 1;
      const max = currentProduct ? currentProduct.stock : 1;
      if (val < max) { input.value = val + 1; updateTotalPrice(); }
    });
  }

  if (input) {
    input.addEventListener('change', () => {
      let val = parseInt(input.value) || 1;
      const max = currentProduct ? currentProduct.stock : 1;
      if (val < 1) val = 1;
      if (val > max) val = max;
      input.value = val;
      updateTotalPrice();
    });
  }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.buyProduct = function (productId) {
  showCheckoutModal(productId);
};

// ============================================
// EVENT LISTENERS
// ============================================

function setupAllEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // History button
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) historyBtn.addEventListener('click', showPurchaseHistory);

  // Checkout form
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Close checkout
  const closeCheckout = document.getElementById('closeCheckout');
  if (closeCheckout) closeCheckout.addEventListener('click', closeCheckoutModal);

  const cancelCheckout = document.getElementById('cancelCheckout');
  if (cancelCheckout) cancelCheckout.addEventListener('click', closeCheckoutModal);

  // Copy account number
  const copyBtn = document.getElementById('copy-account');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const num = document.getElementById('account-number').textContent;
      const success = await copyToClipboard(num);
      if (success) {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      }
    });
  }

  // Modal overlay click to close
  window.addEventListener('click', (e) => {
    const checkoutModal = document.getElementById('checkoutModal');
    if (e.target === checkoutModal) closeCheckoutModal();
  });

  // Keyboard: Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal.show');
      if (modals.length > 0) {
        const last = modals[modals.length - 1];
        if (last.id === 'checkoutModal') closeCheckoutModal();
        else if (last.id === 'confirmDialog') document.getElementById('confirmCancel').click();
        else closeModal(last, true);
      }
    }
  });

  // Init sub-systems
  initQuantityControls();
  initPaymentToggle();
  initSearch();
  initBottomNav();
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  Toast.init();
  setupAllEventListeners();
  loadProducts();
});
