/**
 * Smart Parking Platform - Admin Dashboard Operations (MongoDB Connected)
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Tab Switching
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

      if (targetId === 'lotsSection') loadAdminLots();
      if (targetId === 'slotsSection') loadAdminSlots();
      if (targetId === 'bookingsSection') loadAdminBookings();
    });
  });

  // Modal: Add Parking Lot
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
    addLotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newLotName').value.trim();
      const location = document.getElementById('newLotLoc').value.trim();
      const address = document.getElementById('newLotAddress').value.trim() || location;
      const totalSlots = document.getElementById('newLotCap').value.trim();
      const hourlyRate = document.getElementById('newLotRate').value.trim();

      if (!name || !location || !totalSlots || !hourlyRate) {
        window.showAlert('Please fill in all required fields.', 'warning');
        return;
      }

      try {
        const res = await window.authFetch('/api/admin/parking-lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, location, address, totalSlots, hourlyRate })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          window.showAlert(data.error || 'Failed to add facility.', 'warning');
          return;
        }

        window.showAlert(`Parking facility "${name}" saved to MongoDB with ${totalSlots} bays!`, 'success');
        addLotForm.reset();
        addLotModal.style.display = 'none';
        await loadAdminStats();
        await loadAdminLots();
      } catch (err) {
        console.error('Add lot error:', err);
        window.showAlert('Network error saving facility.', 'warning');
      }
    });
  }

  // Modal: Edit Parking Lot
  const editLotModal = document.getElementById('editLotModal');
  const closeEditLotModalBtn = document.getElementById('closeEditLotModal');
  const editLotForm = document.getElementById('editLotForm');

  if (closeEditLotModalBtn && editLotModal) {
    closeEditLotModalBtn.addEventListener('click', () => {
      editLotModal.style.display = 'none';
    });
  }

  if (editLotForm) {
    editLotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editLotId').value;
      const name = document.getElementById('editLotName').value.trim();
      const location = document.getElementById('editLotLoc').value.trim();
      const address = document.getElementById('editLotAddress').value.trim();
      const hourlyRate = document.getElementById('editLotRate').value.trim();
      const operatingHours = document.getElementById('editLotHours').value.trim();

      try {
        const res = await window.authFetch(`/api/admin/parking-lots/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, location, address, hourlyRate, operatingHours })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          window.showAlert(data.error || 'Failed to update facility.', 'warning');
          return;
        }

        window.showAlert(`Facility "${name}" updated in MongoDB.`, 'success');
        editLotModal.style.display = 'none';
        await loadAdminLots();
      } catch (err) {
        console.error('Update lot error:', err);
        window.showAlert('Network error updating facility.', 'warning');
      }
    });
  }

  // Form: Add Slot Bay
  const addSlotForm = document.getElementById('addSlotForm');
  if (addSlotForm) {
    addSlotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lotId = document.getElementById('slotLotSelector').value;
      const slotNumber = document.getElementById('newSlotNumber').value.trim();
      const slotType = document.getElementById('newSlotType').value;

      if (!lotId || !slotNumber) {
        window.showAlert('Select a facility and enter a bay number.', 'warning');
        return;
      }

      try {
        const res = await window.authFetch(`/api/admin/parking-lots/${lotId}/slots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slotNumber, slotType })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          window.showAlert(data.error || 'Failed to add slot.', 'warning');
          return;
        }

        window.showAlert(`Slot ${slotNumber} added to facility.`, 'success');
        document.getElementById('newSlotNumber').value = '';
        await loadAdminSlots();
        await loadAdminStats();
      } catch (err) {
        console.error('Add slot error:', err);
      }
    });
  }

  // Filter Bookings on search or select
  const searchInput = document.getElementById('adminBookingSearch');
  const statusFilter = document.getElementById('adminBookingStatusFilter');
  if (searchInput) searchInput.addEventListener('keyup', loadAdminBookings);
  if (statusFilter) statusFilter.addEventListener('change', loadAdminBookings);

  // Initial Data Load
  await loadAdminStats();
  await loadAdminLots();
});

// Load Overview Statistics
async function loadAdminStats() {
  try {
    const res = await window.authFetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      const s = data.stats;
      document.getElementById('statTotalLots').textContent = `${s.totalLots} Lots`;
      document.getElementById('statTotalSlots').textContent = `${s.totalSlots} Bays`;
      document.getElementById('statOccupancy').textContent = s.occupancyRate;
      document.getElementById('statBookings').textContent = `${s.confirmedBookings} Active (${s.totalRevenue})`;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

// Load Parking Lots Table
async function loadAdminLots() {
  const tbody = document.getElementById('adminLotsTableBody');
  try {
    const res = await fetch('/api/parking-lots');
    const data = await res.json();

    if (!res.ok || !data.success) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${data.error || 'Failed to load lots.'}</td></tr>`;
      return;
    }

    const lots = data.lots || [];
    tbody.innerHTML = lots.map(lot => `
      <tr>
        <td><strong>${lot.name}</strong></td>
        <td>📍 ${lot.address || lot.location}</td>
        <td>${lot.totalSlots} Bays (<span style="color:var(--status-available); font-weight:700;">${lot.availableSlots} Open</span>)</td>
        <td>₹${lot.hourlyRate}/hr</td>
        <td><span class="badge ${lot.availableSlots > 0 ? 'badge-available' : 'badge-occupied'}">${lot.availableSlots > 0 ? 'Operational' : 'Full'}</span></td>
        <td>
          <div style="display:flex; gap:6px;">
            <a href="slot-selection.html?lotId=${lot._id}&lotName=${encodeURIComponent(lot.name)}" class="btn btn-outline btn-sm">Inspect Bays</a>
            <button class="btn btn-outline btn-sm" onclick="openEditLotModal('${lot._id}', '${escapeQuotes(lot.name)}', '${escapeQuotes(lot.location)}', '${escapeQuotes(lot.address || '')}', ${lot.hourlyRate}, '${escapeQuotes(lot.operatingHours || '24/7')}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteFacility('${lot._id}', '${escapeQuotes(lot.name)}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Lots error:', err);
  }
}

function escapeQuotes(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function openEditLotModal(id, name, location, address, rate, hours) {
  document.getElementById('editLotId').value = id;
  document.getElementById('editLotName').value = name;
  document.getElementById('editLotLoc').value = location;
  document.getElementById('editLotAddress').value = address || location;
  document.getElementById('editLotRate').value = rate;
  document.getElementById('editLotHours').value = hours || '24/7';
  document.getElementById('editLotModal').style.display = 'flex';
}

async function deleteFacility(lotId, lotName) {
  if (!confirm(`Are you sure you want to permanently delete facility "${lotName}" and all its bays? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await window.authFetch(`/api/admin/parking-lots/${lotId}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.showAlert(data.error || 'Failed to delete facility.', 'warning');
      return;
    }

    window.showAlert(data.message, 'success');
    await loadAdminStats();
    await loadAdminLots();
  } catch (err) {
    console.error('Delete lot error:', err);
    window.showAlert('Network error deleting facility.', 'warning');
  }
}

// Load Slot Management
async function loadAdminSlots() {
  const selector = document.getElementById('slotLotSelector');
  const tbody = document.getElementById('adminSlotsTableBody');

  try {
    const lotRes = await fetch('/api/parking-lots');
    const lotData = await lotRes.json();
    const lots = lotData.lots || [];

    if (selector.options.length <= 1) {
      selector.innerHTML = lots.map(l => `<option value="${l._id}">${l.name}</option>`).join('');
    }

    const selectedLotId = selector.value;
    if (!selectedLotId) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Please select a facility from the dropdown above.</td></tr>';
      return;
    }

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">Loading bays from database...</td></tr>';

    const slotRes = await fetch(`/api/parking-lots/${selectedLotId}/slots`);
    const slotData = await slotRes.json();

    const slots = slotData.slots || [];
    if (slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No bays configured. Add one below.</td></tr>';
      return;
    }

    tbody.innerHTML = slots.map(s => {
      const isAvail = s.status === 'AVAILABLE';
      let badgeClass = 'badge-available';
      if (s.status === 'OCCUPIED') badgeClass = 'badge-occupied';
      if (s.status === 'RESERVED') badgeClass = 'badge-reserved';

      return `
        <tr>
          <td><strong>${s.slotNumber}</strong></td>
          <td>${s.slotNumber.startsWith('A-') ? 'Lane A' : (s.slotNumber.startsWith('B-') ? 'Lane B' : 'Section C')}</td>
          <td>${s.slotType || 'Car'}</td>
          <td><span class="badge ${badgeClass}">${s.status}</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="toggleSlotStatus('${s._id}', '${isAvail ? 'OCCUPIED' : 'AVAILABLE'}')">
              Mark ${isAvail ? 'Occupied' : 'Available'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Slots error:', err);
  }
}

async function toggleSlotStatus(slotId, newStatus) {
  try {
    const res = await window.authFetch(`/api/admin/slots/${slotId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.showAlert(data.error || 'Failed to update slot status.', 'warning');
      return;
    }

    window.showAlert(data.message, 'success');
    await loadAdminSlots();
    await loadAdminStats();
  } catch (err) {
    console.error('Toggle slot error:', err);
  }
}

// Load All Bookings
async function loadAdminBookings() {
  const tbody = document.getElementById('adminBookingsTableBody');
  const search = document.getElementById('adminBookingSearch') ? document.getElementById('adminBookingSearch').value.trim() : '';
  const status = document.getElementById('adminBookingStatusFilter') ? document.getElementById('adminBookingStatusFilter').value : 'ALL';

  try {
    const url = `/api/bookings/all?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`;
    const res = await window.authFetch(url);
    const data = await res.json();

    if (!res.ok || !data.success) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">${data.error || 'Failed to load bookings.'}</td></tr>`;
      return;
    }

    const bookings = data.bookings || [];
    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-muted);">No reservations found matching your criteria.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const driver = b.user ? b.user.name : 'Registered Driver';
      const facility = b.parkingLot ? b.parkingLot.name : 'N/A';
      const slot = b.parkingSlot ? b.parkingSlot.slotNumber : 'N/A';
      const isConfirmed = b.bookingStatus === 'CONFIRMED';

      let badgeClass = 'badge-available';
      if (b.bookingStatus === 'CANCELLED') badgeClass = 'badge-occupied';
      if (b.bookingStatus === 'COMPLETED') badgeClass = 'badge-reserved';

      return `
        <tr>
          <td><strong>#${b.bookingId}</strong></td>
          <td>${driver}</td>
          <td>${b.vehicleNumber} (${b.vehicleType || 'Car'})</td>
          <td>${facility} (<strong>${slot}</strong>)</td>
          <td>${b.bookingDate} | ${b.startTime} - ${b.endTime}</td>
          <td>₹${b.totalAmount}</td>
          <td><span class="badge ${badgeClass}">${b.bookingStatus}</span></td>
          <td>
            <div style="display:flex; gap:6px;">
              ${isConfirmed ? `
                <button class="btn btn-outline btn-sm" onclick="updateBookingState('${b._id}', 'COMPLETED')">Complete</button>
                <button class="btn btn-danger btn-sm" onclick="updateBookingState('${b._id}', 'CANCELLED')">Release</button>
              ` : `<span style="color:var(--text-muted); font-size:0.85rem;">Archived</span>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Bookings error:', err);
  }
}

async function updateBookingState(id, newStatus) {
  const actionText = newStatus === 'COMPLETED' ? 'mark this booking as COMPLETED' : 'cancel this booking and release the bay';
  if (!confirm(`Are you sure you want to ${actionText}?`)) return;

  try {
    const res = await window.authFetch(`/api/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.showAlert(data.error || 'Failed to update booking status.', 'warning');
      return;
    }

    window.showAlert(data.message, 'success');
    await loadAdminBookings();
    await loadAdminStats();
  } catch (err) {
    console.error('Booking state error:', err);
  }
}
