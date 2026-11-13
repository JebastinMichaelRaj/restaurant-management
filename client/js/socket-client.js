// Loaded via CDN script tag <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
// Connects to the backend socket server for real-time updates.
const socket = io('http://localhost:5000');

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
