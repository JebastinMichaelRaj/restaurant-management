// Shared auth helpers used across all pages.
function getCurrentUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'index.html';
  }
}

// Redirect if the current user doesn't have one of the allowed roles
function requireRole(...roles) {
  const user = getCurrentUser();
  if (!user || !roles.includes(user.role)) {
    alert('You do not have permission to view this page.');
    window.location.href = 'menu.html';
  }
}

function renderNav(activePage) {
  const user = getCurrentUser();
  const nav = document.getElementById('nav');
  if (!nav) return;

  let links = `<a href="menu.html" ${activePage === 'menu' ? 'style="text-decoration:underline"' : ''}>Menu</a>`;

  if (user) {
    links += `<a href="reservation.html" ${activePage === 'reservation' ? 'style="text-decoration:underline"' : ''}>Reserve Table</a>`;
    links += `<a href="cart.html" ${activePage === 'cart' ? 'style="text-decoration:underline"' : ''}>My Orders</a>`;
    if (['chef', 'admin', 'waiter'].includes(user.role)) {
      links += `<a href="kitchen.html" ${activePage === 'kitchen' ? 'style="text-decoration:underline"' : ''}>Kitchen</a>`;
    }
    if (user.role === 'admin') {
      links += `<a href="admin.html" ${activePage === 'admin' ? 'style="text-decoration:underline"' : ''}>Admin</a>`;
    }
    links += `<a href="#" id="logoutBtn">Logout (${user.name})</a>`;
  } else {
    links += `<a href="index.html">Login / Register</a>`;
  }

  nav.innerHTML = links;
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}
