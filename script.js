// Combined JavaScript file with all functionality

// Debugging info
console.log("=== DEBUGGING TOKO APLIKASI PREMIUM ===");
console.log("Script dimuat pada:", new Date().toISOString());
console.log("Firebase tersedia:", typeof firebase !== 'undefined');
console.log("Window objects:", {
  firebaseApp: typeof window.firebaseApp !== 'undefined',
  firebaseAuth: typeof window.firebaseAuth !== 'undefined',
  firebaseDatabase: typeof window.firebaseDatabase !== 'undefined'
});

// Utility functions
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

function validateProductData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 3) {
    errors.push("Nama aplikasi minimal 3 karakter");
  }
  
  if (!data.desc || data.desc.trim().length < 10) {
    errors.push("Deskripsi minimal 10 karakter");
  }
  
  if (isNaN(data.stock) || data.stock < 0) {
    errors.push("Stok harus berupa angka positif");
  }
  
  if (isNaN(data.price) || data.price < 0) {
    errors.push("Harga harus berupa angka positif");
  }
  
  if (!data.img || !data.img.trim()) {
    errors.push("Link gambar tidak boleh kosong");
  } else {
    try {
      new URL(data.img);
    } catch (e) {
      errors.push("Link gambar harus berupa URL yang valid");
    }
  }
  
  return errors;
}

function showError(message, container) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  container.insertBefore(errorDiv, container.firstChild);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message, container) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;
  container.insertBefore(successDiv, container.firstChild);
  setTimeout(() => successDiv.remove(), 5000);
}

function validateInput(input, rules) {
  if (rules.required && !input.value.trim()) {
    return `${input.name} is required`;
  }
  if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    return 'Please enter a valid email address';
  }
  if (rules.minLength && input.value.length < rules.minLength) {
    return `${input.name} must be at least ${rules.minLength} characters`;
  }
  return null;
}

// Loading States
function showLoading(container) {
  container.innerHTML = `
    <div class="skeleton-loader">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function hideLoading(container) {
  const loader = container.querySelector('.skeleton-loader');
  if (loader) {
    loader.remove();
  }
}

// Error handling
window.addEventListener('error', function(event) {
  const container = document.querySelector('main') || document.body;
  showError('An unexpected error occurred. Please refresh the page.', container);
  console.error('Global error:', event.error);
});

// Get Firebase instances
const auth = firebase.auth();
const database = firebase.database();
const analytics = firebase.analytics();

// Global variables
let products = [];
let waNumber = localStorage.getItem('waNumber') || '6285156545003';
let adminLoggedIn = false;
let purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
let currentProduct = null;

// Constants
const ADMIN_EMAIL = 'erzambayu@gmail.com';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer = null;
let sessionTimeout = null;

// DOM Elements
const adminBtn = document.getElementById('adminBtn');
const adminPanel = document.getElementById('adminPanel');
const closeAdmin = document.getElementById('closeAdmin');
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const editIndex = document.getElementById('editIndex');
const themeToggle = document.getElementById('themeToggle');
const historyBtn = document.getElementById('historyBtn');
const catalog = document.getElementById('catalog');

// Image loading optimization
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

async function optimizeImageDisplay(imgElement, url) {
  try {
    imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
    imgElement.classList.add('loading');
    await loadImage(url);
    imgElement.src = url;
    imgElement.classList.remove('loading');
  } catch (error) {
    console.error('Error loading image:', error);
    imgElement.src = 'https://via.placeholder.com/300';
    imgElement.alt = 'Image failed to load';
  }
}

// Theme handling
let currentTheme = localStorage.getItem('theme') || 'light';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeButton();
}
function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const isDark = (document.documentElement.getAttribute('data-theme') === 'dark');
    themeToggle.innerHTML = `
      <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
      ${isDark ? 'Light Mode' : 'Dark Mode'}
    `;
  }
}
// Set initial theme
applyTheme(currentTheme);

// Firebase functions
async function loadProducts() {
  try {
    console.log("Loading products from Firebase...");
    const productsRef = database.ref('products');
    const snapshot = await productsRef.once('value');
    const data = snapshot.val();
    console.log("Products data from Firebase:", data);
    
    // Konversi data ke array
    products = data ? Object.entries(data).map(([key, value]) => ({ 
      id: key, 
      ...value 
    })) : [];
    
    console.log("Processed products array:", products);
    
    // Tampilkan produk
    displayProducts(products);
    // Tampilkan daftar produk di admin panel jika admin login
    if (adminLoggedIn) renderProductList();
  } catch (error) {
    console.error("Error loading products:", error);
    if (catalog) {
      catalog.innerHTML = `<div class="error-message">Error loading products: ${error.message}</div>`;
    }
  }
}

// Fungsi untuk memformat deskripsi dengan line breaks
function formatDescription(description) {
  // Handle undefined or null descriptions
  if (!description) return '';

  // Mengganti emoji dan karakter khusus yang umum digunakan
  const emojiMap = {
    '✨': '✨\n',
    '🔥': '🔥\n',
    '✅': '✅\n',
    '🎮': '🎮\n',
    '🌐': '🌐\n',
    '🔒': '🔒\n',
    '✔️': '✔️\n',
    '📱': '📱\n',
    '💻': '💻\n',
    '🎨': '🎨\n',
    '🖌️': '🖌️\n',
    '💡': '💡\n'
  };

  // Mengganti karakter pemisah dengan line break
  let formattedDesc = description
    .replace(/([!.]) /g, '$1\n') // Menambah line break setelah tanda seru dan titik
    .replace(/([✨🔥✅🎮🌐🔒✔️📱💻🎨🖌️💡])/g, match => emojiMap[match] || match) // Menambah line break setelah emoji
    .replace(/\) /g, ')\n') // Menambah line break setelah tutup kurung
    .replace(/ - /g, '\n- ') // Mengubah strip menjadi bullet points dengan line break
    .replace(/\n\s*\n/g, '\n') // Menghapus multiple line breaks
    .trim();

  return formattedDesc;
}

// Update fungsi displayProducts
function displayProducts(products) {
  const catalog = document.getElementById('catalog');
  if (!catalog) {
    console.error('Catalog element not found');
    return;
  }
  
  catalog.innerHTML = '';

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Format deskripsi untuk tampilan
    const formattedDescription = formatDescription(product.desc || product.description || '');
    
    card.innerHTML = `
      <div class="card-header">
        <img src="${product.img || product.image}" alt="${product.name}">
      </div>
      <div class="card-content">
        <h3>${product.name}</h3>
        <p style="white-space: pre-line">${formattedDescription}</p>
        <div class="stock">Stok: ${product.stock}</div>
        <div class="price">Rp ${Number(product.price).toLocaleString('id-ID')}</div>
        <button onclick="buyProduct('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>
          <i class="fab fa-whatsapp"></i>
          Beli via WhatsApp
        </button>
      </div>
    `;
    
    catalog.appendChild(card);
  });
}

// Admin functions
function showLoginPanel() {
  const loginHtml = `
    <div id="loginModal" class="modal">
      <div class="modal-content">
        <span class="close" id="closeLoginBtn">&times;</span>
        <h2>Login Admin</h2>
        <form id="loginForm" autocomplete="off">
          <label>
            Email:
            <input type="email" id="loginEmail" required autocomplete="username">
          </label>
          <label>
            Password:
            <input type="password" id="loginPass" required autocomplete="current-password">
          </label>
          <div class="form-buttons">
            <button type="submit">Login</button>
            <button type="button" class="cancel-btn" id="cancelLoginBtn">Batal</button>
          </div>
        </form>
        <div id="loginError" style="color:red;"></div>
      </div>
    </div>`;
  
  document.body.insertAdjacentHTML('beforeend', loginHtml);
  
  const modal = document.getElementById('loginModal');
  const closeBtn = document.getElementById('closeLoginBtn');
  const cancelBtn = document.getElementById('cancelLoginBtn');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('show'), 10);
  
  const closeLoginPanel = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  closeBtn.onclick = closeLoginPanel;
  cancelBtn.onclick = closeLoginPanel;
  modal.onclick = (e) => {
    if (e.target === modal) closeLoginPanel();
  };
  
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    
    try {
      await auth.signInWithEmailAndPassword(email, password);
      closeLoginPanel();
      if (email === ADMIN_EMAIL) {
        adminPanel.style.display = 'block';
        setTimeout(() => adminPanel.classList.add('show'), 10);
        renderProductList();
      } else {
        auth.signOut();
        loginError.textContent = 'Akses ditolak. Anda bukan admin.';
      }
    } catch (error) {
      console.error("Login error:", error);
      loginError.textContent = 'Email atau password salah!';
    }
  };
}

// Event listeners
adminBtn.onclick = () => {
  if (!adminLoggedIn) {
    showLoginPanel();
  } else {
    // Instead of logging out, show/hide the admin panel
    if (adminPanel.style.display === 'block') {
      adminPanel.classList.remove('show');
      setTimeout(() => {
        adminPanel.style.display = 'none';
      }, 300);
    } else {
      adminPanel.style.display = 'block';
      setTimeout(() => adminPanel.classList.add('show'), 10);
      renderProductList();
    }
  }
};

closeAdmin.onclick = () => {
  adminPanel.classList.remove('show');
  setTimeout(() => {
    adminPanel.style.display = 'none';
    productForm.reset();
    editIndex.value = '';
  }, 300);
};

window.onclick = (e) => {
  if (e.target === adminPanel) {
    adminPanel.classList.remove('show');
    setTimeout(() => {
      adminPanel.style.display = 'none';
    }, 300);
  }
  
  // Untuk checkout modal
  const checkoutModal = document.getElementById('checkoutModal');
  if (e.target === checkoutModal) {
    closeCheckoutModal();
  }
};

// Add admin panel HTML template at the start
const adminPanelTemplate = `
  <div class="admin-header">
    <h2>Admin Panel</h2>
    <button id="logoutBtn" class="logout-btn">
      <i class="fas fa-sign-out-alt"></i> Logout
    </button>
    <span class="close" id="closeAdmin">&times;</span>
  </div>
  <div class="admin-content">
    <form id="productForm">
      <input type="hidden" id="editIndex">
      <div class="form-group">
        <label for="appName">Nama Aplikasi:</label>
        <input type="text" id="appName" required>
      </div>
      <div class="form-group">
        <label for="appDesc">Deskripsi:</label>
        <textarea id="appDesc" required></textarea>
      </div>
      <div class="form-group">
        <label for="appStock">Stok:</label>
        <input type="number" id="appStock" required min="0">
      </div>
      <div class="form-group">
        <label for="appPrice">Harga:</label>
        <input type="number" id="appPrice" required min="0">
      </div>
      <div class="form-group">
        <label for="appImg">Link Gambar:</label>
        <input type="url" id="appImg" required>
      </div>
      <div class="form-buttons">
        <button type="submit">Simpan</button>
        <button type="button" class="cancel-btn">Batal</button>
      </div>
    </form>
    <div id="productList"></div>
  </div>
`;

// Initialize admin panel
function initializeAdminPanel() {
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel && !adminPanel.querySelector('.admin-header')) {
    adminPanel.innerHTML = adminPanelTemplate;
    
    // Re-attach event listeners
    const closeAdmin = document.getElementById('closeAdmin');
    const logoutBtn = document.getElementById('logoutBtn');
    const productForm = document.getElementById('productForm');
    const cancelBtn = productForm.querySelector('.cancel-btn');
    
    closeAdmin.onclick = () => {
      adminPanel.classList.remove('show');
      setTimeout(() => {
        adminPanel.style.display = 'none';
      }, 300);
    };
    
    logoutBtn.onclick = () => {
      if (confirm('Apakah Anda yakin ingin logout?')) {
        auth.signOut();
        adminPanel.classList.remove('show');
        setTimeout(() => {
          adminPanel.style.display = 'none';
        }, 300);
      }
    };
    
    cancelBtn.onclick = () => {
      adminPanel.classList.remove('show');
      setTimeout(() => {
        adminPanel.style.display = 'none';
      }, 300);
    };
    
    productForm.onsubmit = handleProductSubmit;
  }
}

// Handle product form submission
async function handleProductSubmit(e) {
  e.preventDefault();
  
  if (!adminLoggedIn) {
    showError('Anda harus login sebagai admin untuk menambah/edit produk!', productForm);
    return;
  }
  
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
    showError(errors.join('\n'), productForm);
    return;
  }
  
  try {
    const productId = document.getElementById('editIndex').value;
    if (productId) {
      // Update produk
      await database.ref('products/' + productId).set(data);
      document.getElementById('editIndex').value = '';
      showSuccess('Produk berhasil diperbarui!', productForm);
    } else {
      // Tambah produk baru
      await database.ref('products').push(data);
      showSuccess('Produk berhasil ditambahkan!', productForm);
    }
    document.getElementById('productForm').reset();
    // Refresh produk
    loadProducts();
    renderProductList();
  } catch (error) {
    console.error('Error saving product:', error);
    showError('Gagal menyimpan produk: ' + error.message, productForm);
  }
}

// Update DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded");
  
  // Initialize admin panel
  initializeAdminPanel();
  
  // Load products
  loadProducts();
  
  // Setup other event listeners
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.onclick = () => {
      const newTheme = (document.documentElement.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
      applyTheme(newTheme);
    };
  }
  // Update theme button initial state
  updateThemeButton();
  
  // Admin button
  const adminBtn = document.getElementById('adminBtn');
  if (adminBtn) {
    adminBtn.onclick = () => {
      if (!adminLoggedIn) {
        showLoginPanel();
      } else {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel.style.display === 'block') {
          adminPanel.classList.remove('show');
          setTimeout(() => {
            adminPanel.style.display = 'none';
          }, 300);
        } else {
          adminPanel.style.display = 'block';
          setTimeout(() => {
            adminPanel.classList.add('show');
            renderProductList();
          }, 10);
        }
      }
    };
  }
  
  // History button
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.onclick = showPurchaseHistory;
  }
  
  // Setup quantity controls
  setupQuantityControls();
  
  // Setup copy account button
  setupCopyAccountButton();
  
  // Setup checkout form
  setupCheckoutForm();
}

function setupQuantityControls() {
  const decreaseQuantityBtn = document.getElementById('decreaseQuantity');
  const increaseQuantityBtn = document.getElementById('increaseQuantity');
  const quantityInput = document.getElementById('quantity');
  
  if (decreaseQuantityBtn && quantityInput) {
    decreaseQuantityBtn.addEventListener('click', function() {
      let quantity = parseInt(quantityInput.value) || 1;
      if (quantity > 1) {
        quantityInput.value = quantity - 1;
        updateTotalPrice();
      }
    });
  }
  
  if (increaseQuantityBtn && quantityInput) {
    increaseQuantityBtn.addEventListener('click', function() {
      let quantity = parseInt(quantityInput.value) || 1;
      const maxStock = currentProduct ? currentProduct.stock : 1;
      
      if (quantity < maxStock) {
        quantityInput.value = quantity + 1;
        updateTotalPrice();
      }
    });
  }
  
  if (quantityInput) {
    quantityInput.addEventListener('change', function() {
      let quantity = parseInt(this.value) || 1;
      const maxStock = currentProduct ? currentProduct.stock : 1;
      
      if (quantity < 1) quantity = 1;
      if (quantity > maxStock) quantity = maxStock;
      
      this.value = quantity;
      updateTotalPrice();
    });
  }
}

function setupCopyAccountButton() {
  const copyAccountBtn = document.getElementById('copy-account');
  if (copyAccountBtn) {
    copyAccountBtn.addEventListener('click', function() {
      const accountNumber = document.getElementById('account-number').textContent;
      copyToClipboard(accountNumber);
      
      // Add visual feedback
      this.classList.add('active');
      setTimeout(() => {
        this.classList.remove('active');
      }, 300);
    });
  }
}

function setupCheckoutForm() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
  
  const cancelCheckoutBtn = document.getElementById('cancelCheckout');
  const closeCheckoutBtn = document.getElementById('closeCheckout');
  
  if (cancelCheckoutBtn) {
    cancelCheckoutBtn.addEventListener('click', closeCheckoutModal);
  }
  
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  }
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  
  if (!currentProduct) return;
  
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  const notes = document.getElementById('notes').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const totalPrice = currentProduct.price * quantity;
  
  // Add to purchase history
  addToPurchaseHistory({
    product: currentProduct,
    quantity: quantity,
    total: totalPrice,
    paymentMethod: paymentMethod,
    notes: notes
  });
  
  // Create WhatsApp message
  const msg = encodeURIComponent(
    `Halo, saya ingin membeli:\n\n` +
    `Produk: ${currentProduct.name}\n` +
    `Jumlah: ${quantity}\n` +
    `Total: ${formatPrice(totalPrice)}\n` +
    `Metode Pembayaran: ${paymentMethod}\n` +
    (notes ? `Catatan: ${notes}\n\n` : '\n') +
    `Mohon konfirmasi pesanan saya.`
  );
  
  // Open WhatsApp
  window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
  
  // Close modal
  closeCheckoutModal();
}

// Purchase history functions
function addToPurchaseHistory(purchase) {
  purchase.date = new Date().toISOString();
  purchaseHistory.unshift(purchase);
  localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
}

function showPurchaseHistory() {
  const historyHtml = `
    <div id="historyModal" class="modal">
      <div class="modal-content">
        <span class="close" id="closeHistoryBtn">&times;</span>
        <h2>Riwayat Pembelian</h2>
        <div class="history-list">
          ${purchaseHistory.length === 0 ? '<p>Belum ada riwayat pembelian</p>' :
            purchaseHistory.map(p => `
              <div class="history-item">
                <div class="history-header">
                  <h3>${sanitizeHTML(p.product.name)}</h3>
                  <span class="history-date">${new Date(p.date).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div class="history-details">
                  <p>Jumlah: ${p.quantity}</p>
                  <p>Total: ${formatPrice(p.total)}</p>
                  <p>Metode Pembayaran: ${p.paymentMethod}</p>
                  ${p.notes ? `<p>Catatan: ${sanitizeHTML(p.notes)}</p>` : ''}
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', historyHtml);
  const modal = document.getElementById('historyModal');
  const closeBtn = document.getElementById('closeHistoryBtn');
  
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('show'), 10);
  
  closeBtn.onclick = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  };
}

// Checkout Modal Functions
function showCheckoutModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  currentProduct = product;
  
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  
  // Set nilai-nilai pada form checkout
  document.getElementById('checkout-product-id').value = product.id;
  document.getElementById('checkout-product-name').textContent = product.name;
  document.getElementById('checkout-product-desc').textContent = product.desc || '';
  document.getElementById('checkout-product-price').textContent = formatPrice(product.price);
  document.getElementById('checkout-product-stock').textContent = `Stok: ${product.stock}`;
  document.getElementById('checkout-product-image').src = product.img || product.image || 'https://via.placeholder.com/300';
  
  // Reset form
  document.getElementById('quantity').value = 1;
  document.getElementById('notes').value = '';
  document.getElementById('payment-qris').checked = true;
  
  // Setup payment method event listeners
  setupPaymentMethodListeners();
  
  // Show QRIS info by default
  document.getElementById('qris-info').style.display = 'block';
  document.getElementById('bca-info').style.display = 'none';
  
  // Update total harga
  updateTotalPrice();
  
  // Tampilkan modal
  modal.style.display = 'block';
  setTimeout(() => modal.classList.add('show'), 10);
}

function setupPaymentMethodListeners() {
  const qrisRadio = document.getElementById('payment-qris');
  const bcaRadio = document.getElementById('payment-bca');
  const qrisInfo = document.getElementById('qris-info');
  const bcaInfo = document.getElementById('bca-info');
  
  if (qrisRadio) {
    qrisRadio.addEventListener('change', function() {
      if (this.checked) {
        qrisInfo.style.display = 'block';
        bcaInfo.style.display = 'none';
      }
    });
  }
  
  if (bcaRadio) {
    bcaRadio.addEventListener('change', function() {
      if (this.checked) {
        qrisInfo.style.display = 'none';
        bcaInfo.style.display = 'block';
      }
    });
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

function updateTotalPrice() {
  if (!currentProduct) return;
  
  const quantity = parseInt(document.getElementById('quantity').value) || 1;
  const totalPrice = currentProduct.price * quantity;
  document.getElementById('checkout-total-price').textContent = formatPrice(totalPrice);
}

// Copy to clipboard function
function copyToClipboard(text) {
  // Modern clipboard API method
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showCopySuccess())
      .catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback to older method if modern API fails
        fallbackCopyToClipboard(text);
      });
  } else {
    // Fallback for browsers that don't support clipboard API
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  // Create temporary element
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  
  // Select and copy the text
  const selected = document.getSelection().rangeCount > 0 
    ? document.getSelection().getRangeAt(0) 
    : false;
  
  el.select();
  const success = document.execCommand('copy');
  document.body.removeChild(el);
  
  // Restore original selection if there was any
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
  
  if (success) {
    showCopySuccess();
  } else {
    console.error('Failed to copy text using execCommand');
  }
}

function showCopySuccess() {
  // Create success message element
  const successMsg = document.createElement('div');
  successMsg.className = 'copy-success';
  successMsg.textContent = 'Nomor rekening berhasil disalin!';
  document.body.appendChild(successMsg);
  
  // Show and hide message with animation
  setTimeout(() => {
    successMsg.classList.add('show');
    setTimeout(() => {
      successMsg.classList.remove('show');
      setTimeout(() => {
        successMsg.remove();
      }, 300);
    }, 2000);
  }, 10);
}

// Global functions
window.buyProduct = function(productId) {
  showCheckoutModal(productId);
};

window.editProduct = function(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  document.getElementById('appName').value = product.name;
  document.getElementById('appDesc').value = product.desc || '';
  document.getElementById('appStock').value = product.stock;
  document.getElementById('appPrice').value = product.price;
  document.getElementById('appImg').value = product.img || product.image || '';
  // Simpan ID produk yang diedit
  document.getElementById('editIndex').value = product.id;
  adminPanel.style.display = 'block';
  setTimeout(() => adminPanel.classList.add('show'), 10);
};

window.deleteProduct = function(productId) {
  if (confirm('Yakin ingin menghapus produk ini?')) {
    database.ref('products/' + productId).remove()
      .then(() => {
        alert('Produk berhasil dihapus!');
        loadProducts();
      })
      .catch(error => {
        console.error('Error deleting product:', error);
        alert('Gagal menghapus produk. Error: ' + error.message);
      });
  }
};

// Authentication observer
auth.onAuthStateChanged((user) => {
  if (user) {
    if (user.email === ADMIN_EMAIL) {
      adminLoggedIn = true;
      adminBtn.textContent = 'Admin Panel';
      adminBtn.classList.add('logged-in');
    } else {
      auth.signOut();
      alert('Akses ditolak. Anda bukan admin.');
    }
  } else {
    adminLoggedIn = false;
    adminBtn.textContent = 'Admin Panel';
    adminBtn.classList.remove('logged-in');
    adminPanel.classList.remove('show');
    setTimeout(() => {
      adminPanel.style.display = 'none';
    }, 300);
  }
});

// Fungsi untuk menampilkan daftar produk di admin panel
function renderProductList() {
  const productList = document.getElementById('productList');
  if (!productList) return;
  productList.innerHTML = '';
  if (!products || products.length === 0) {
    productList.innerHTML = '<li><em>Tidak ada produk</em></li>';
    return;
  }
  products.forEach((p, index) => {
    productList.innerHTML += `
      <li>
        <span>${sanitizeHTML(p.name)} (Stok: ${p.stock})</span>
        <div class="button-group">
          <button class="edit-btn" onclick="window.editProduct('${p.id}')">Edit</button>
          <button class="hapus-btn" onclick="window.deleteProduct('${p.id}')">Hapus</button>
        </div>
      </li>`;
  });
}
