/**
 * Smart Parking Platform - Admin Dashboard Logic
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching inside Admin Portal
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const sections = document.querySelectorAll('.admin-section');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
    });
  });

  // Modal controls for Adding a Lot
  const addLotModal = document.getElementById('addLotModal');
  const openLotModalBtn = document.getElementById('openAddLotModal');
  const closeLotModalBtn = document.getElementById('closeAddLotModal');
  const addLotForm = document.getElementById('addLotForm');

  if (openLotModalBtn && addLotModal) {
    openLotModalBtn.addEventListener('click', () => {
      addLotModal.style.display = 'flex';
    });
  }

  if (closeLotModalBtn && addLotModal) {
    closeLotModalBtn.addEventListener('click', () => {
      addLotModal.style.display = 'none';
    });
  }

  if (addLotForm) {
    addLotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const lotName = document.getElementById('newLotName').value.trim();
      const lotLoc = document.getElementById('newLotLoc').value.trim();
      const lotCap = document.getElementById('newLotCap').value.trim();
      const lotRate = document.getElementById('newLotRate').value.trim();

      if (!lotName || !lotLoc || !lotCap || !lotRate) {
        window.showAlert('Please fill in all fields for the new parking lot.', 'warning');
        return;
      }

      // Add to table dynamically
      const tableBody = document.getElementById('adminLotsTableBody');
      const newRow = document.createElement('tr');
      newRow.innerHTML = `
        <td><strong>${lotName}</strong></td>
        <td>📍 ${lotLoc}</td>
        <td>${lotCap} Bays</td>
        <td>₹${lotRate}/hr</td>
        <td><span class="badge badge-available">Active</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editLot(this)">Edit</button>
        </td>
      `;
      tableBody.appendChild(newRow);

      window.showAlert(`Parking facility "${lotName}" added successfully!`, 'success');
      addLotForm.reset();
      addLotModal.style.display = 'none';
    });
  }
});

// Admin global helper functions
function toggleSlotStatus(button) {
  const row = button.closest('tr');
  const statusBadge = row.querySelector('.slot-badge');
  const current = statusBadge.textContent.trim().toLowerCase();

  if (current.includes('available')) {
    statusBadge.className = 'badge badge-occupied slot-badge';
    statusBadge.textContent = 'Occupied';
    button.textContent = 'Mark Available';
  } else {
    statusBadge.className = 'badge badge-available slot-badge';
    statusBadge.textContent = 'Available';
    button.textContent = 'Mark Occupied';
  }
}

function releaseBooking(button, bookingId) {
  if (confirm(`Are you sure you want to release and complete booking #${bookingId}?`)) {
    const row = button.closest('tr');
    const badge = row.querySelector('.booking-badge');
    badge.className = 'badge badge-reserved booking-badge';
    badge.textContent = 'Completed';
    button.parentElement.innerHTML = '<span style="color:var(--text-muted);font-size:0.85rem;">Released</span>';
    window.showAlert(`Booking #${bookingId} released. Slot marked available.`, 'info');
  }
}
