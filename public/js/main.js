/**
 * Smart Parking Platform - Main Frontend Utilities & JWT Interceptor
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

// Global Notification / Alert helper
window.showAlert = function (message, type = 'info') {
  const alertBox = document.createElement('div');
  alertBox.className = `alert alert-${type}`;
  alertBox.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;cursor:pointer;font-weight:bold;margin-left:12px;" onclick="this.parentElement.remove()">✕</button>
  `;
  const container = document.querySelector('.main-content .container');
  if (container) {
    container.insertBefore(alertBox, container.firstChild);
    setTimeout(() => alertBox.remove(), 4000);
  }
};

// Authenticated Fetch Wrapper with JWT Authorization Header
window.authFetch = async function (url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
};

// Global Logout Handler
window.handleLogout = async function () {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout error:', e);
  }
  localStorage.removeItem('auth_token');
  window.location.href = 'login.html';
};

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const toggleBtn = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // 2. Active Navigation Highlight
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});
