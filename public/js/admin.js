/**
 * Smart Parking Platform - Admin Dashboard Logic (MongoDB Connected)
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
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

      if (targetId === 'lotsSection') loadAdminLots();
      if (targetId === 'slotsSection') loadAdminSlots();
      if (targetId === 'bookingsSection') loadAdminBookings();
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
    addLotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newLotName').value.trim();
      const location = document.getElementById('newLotLoc').value.trim();
      const address = document.getElementById('newLotAddress') ? document.getElementById('newLotAddress').value.trim() : location;
      const totalSlots = document.getElementById('newLotCap').value.trim();
      const hourlyRate = document.getElementById('newLotRate').value.trim();

      if (!name || !location || !totalSlots || !hourlyRate) {
        window.showAlert('Please fill in all fields.', 'warning');
        return;
      }

      try {
        const res = await fetch('/api/admin/parking-lots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, location, address, totalSlots, hourlyRate })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          window.showAlert(data.error || 'Failed to add facility.', 'warning');
          return;
        }

        window.showAlert(`Parking facility "${name}" created with ${totalSlots} slots!`, 'success');
        addLotForm.reset();
        addLotModal.style.display = 'none';
        await loadAdminStats();
        await loadAdminLots();
      } catch (err) {
        console.error('Add lot error:', err);
        window.showAlert('Network error saving parking lot.', 'warning');
      }
    });
  }

  // Initial Load
  await loadAdminStats();
  await loadAdminLots();
});

// Load Overview Statistics
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats');
    if (res.ok) {
      const data = await res.json();
      const s = data.stats;
      document.getElementById('statTotalLots').textContent = `${s.totalLots} Lots`;
      document.getElementById('statTotalSlots').textContent = `${s.totalSlots} Bays`;
      document.getElementById('statOccupancy').textContent = s.occupancyRate;
      document.getElementById('statBookings').textContent = `${s.confirmedBookings} Active`;
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
        <td>${lot.totalSlots} Bays (${lot.availableSlots} Open)</td>
        <td>₹${lot.hourlyRate}/hr</td>
        <td><span class="badge ${lot.availableSlots > 0 ? 'badge-available' : 'badge-occupied'}">${lot.availableSlots > 0 ? 'Operational' : 'Full'}</span></td>
        <td>
          <a href="slot-selection.html?lotId=${lot._id}&lotName=${encodeURIComponent(lot.name)}" class="btn btn-outline btn-sm">Inspect Bays</a>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Lots error:', err);
  }
}

// Load Slot Management
async function loadAdminSlots() {
  const selector = document.getElementById('slotLotSelector');
  const tbody = document.getElementById('adminSlotsTableBody');

  try {
    // Populate dropdown with lots if not already done
    const lotRes = await fetch('/api/parking-lots');
    const lotData = await lotRes.json();
    const lots = lotData.lots || [];

    if (selector.options.length <= 1) {
      selector.innerHTML = lots.map(l => `<option value="${l._id}">${l.name}</option>`).join('');
    }

    const selectedLotId = selector.value;
    if (!selectedLotId) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">Loading bays...</td></tr>';

    const slotRes = await fetch(`/api/parking-lots/${selectedLotId}/slots`);
    const slotData = await slotRes.json();

    const slots = slotData.slots || [];
    tbody.innerHTML = slots.map(s => {
      const isAvail = s.status === 'AVAILABLE';
      return `
        <tr>
          <td><strong>${s.slotNumber}</strong></td>
          <td>${s.slotNumber.startsWith('A-') ? 'Lane A (Main Gate)' : 'Lane B (South Wing)'}</td>
          <td>${s.slotType || 'Car'}</td>
          <td><span class="badge ${isAvail ? 'badge-available' : 'badge-occupied'}">${s.status}</span></td>
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
    const res = await fetch(`/api/admin/slots/${slotId}/status`, {
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
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:16px;">Loading platform bookings...</td></tr>';

  try {
    const res = await fetch('/api/bookings/all');
    const data = await res.json();

    if (!res.ok || !data.success) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">${data.error || 'Failed to load bookings.'}</td></tr>`;
      return;
    }

    const bookings = data.bookings || [];
    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">No bookings recorded in platform.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const driver = b.user ? b.user.name : 'Unknown User';
      const facility = b.parkingLot ? b.parkingLot.name : 'N/A';
      const slot = b.parkingSlot ? b.parkingSlot.slotNumber : 'N/A';
      const isConfirmed = b.bookingStatus === 'CONFIRMED';

      return `
        <tr>
          <td><strong>#${b.bookingId}</strong></td>
          <td>${driver}</td>
          <td>${b.vehicleNumber}</td>
          <td>${facility} (${slot})</td>
          <td>${b.bookingDate} | ${b.startTime} - ${b.endTime}</td>
          <td>₹${b.totalAmount}</td>
          <td><span class="badge ${isConfirmed ? 'badge-available' : 'badge-occupied'}">${b.bookingStatus}</span></td>
          <td>
            ${isConfirmed ? `
              <button class="btn btn-danger btn-sm" onclick="releaseAdminBooking('${b._id}', '${b.bookingId}')">Release Slot</button>
            ` : '<span style="color:var(--text-muted);font-size:0.85rem;">Closed</span>'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Bookings error:', err);
  }
}

async function releaseAdminBooking(bookingId, passNo) {
  if (!confirm(`Are you sure you want to release and cancel booking #${passNo}?`)) return;

  try {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'PUT' });
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.showAlert(data.error || 'Failed to release booking.', 'warning');
      return;
    }

    window.showAlert(`Booking #${passNo} released and slot freed.`, 'info');
    await loadAdminBookings();
    await loadAdminStats();
  } catch (err) {
    console.error('Release error:', err);
  }
}
