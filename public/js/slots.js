/**
 * Smart Parking Platform - Interactive Slot Selection Logic (MongoDB Connected)
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lotId = urlParams.get('lotId');
  const fallbackLotName = urlParams.get('lotName') || 'Campus Parking Facility';
  const fallbackRate = urlParams.get('rate') || '20';

  const lotTitleEl = document.getElementById('selectedLotTitle');
  const lotRateEl = document.getElementById('selectedLotRate');
  const laneAContainer = document.getElementById('laneAGrid');
  const laneBContainer = document.getElementById('laneBGrid');
  const proceedBtn = document.getElementById('proceedBookingBtn');
  const selectedBayDisplay = document.getElementById('selectedBayDisplay');

  let selectedSlotId = null;
  let selectedSlotNumber = null;
  let activeLotRate = fallbackRate;
  let activeLotName = fallbackLotName;

  if (!lotId) {
    window.showAlert('No parking lot selected. Redirecting to lots directory...', 'warning');
    setTimeout(() => window.location.href = 'parking-lots.html', 1500);
    return;
  }

  // Fetch real slots for this lot from MongoDB API
  try {
    const res = await fetch(`/api/parking-lots/${lotId}/slots`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      window.showAlert(data.error || 'Unable to load slots from database.', 'warning');
      return;
    }

    activeLotName = data.lotName || fallbackLotName;
    activeLotRate = data.hourlyRate || fallbackRate;

    if (lotTitleEl) lotTitleEl.textContent = activeLotName;
    if (lotRateEl) lotRateEl.textContent = `₹${activeLotRate} / hr`;

    const slots = data.slots || [];

    if (slots.length === 0) {
      laneAContainer.innerHTML = '<div style="padding: 20px; color: var(--text-muted);">No slots configured for this facility.</div>';
      return;
    }

    // Split slots into Lane A and Lane B
    const laneASlots = slots.filter(s => s.slotNumber.startsWith('A-'));
    const laneBSlots = slots.filter(s => s.slotNumber.startsWith('B-'));

    // Count available
    const availCountA = laneASlots.filter(s => (s.dynamicStatus || s.status) === 'AVAILABLE').length;
    const availCountB = laneBSlots.filter(s => (s.dynamicStatus || s.status) === 'AVAILABLE').length;

    const countBadgeA = document.getElementById('laneACountBadge');
    if (countBadgeA) countBadgeA.textContent = `${availCountA} Available`;

    const countBadgeB = document.getElementById('laneBCountBadge');
    if (countBadgeB) countBadgeB.textContent = `${availCountB} Available`;

    // Render slots function
    function renderSlotHtml(slot) {
      const status = (slot.dynamicStatus || slot.status || 'AVAILABLE').toUpperCase();
      let statusClass = 'available';
      let statusLabel = 'Available';

      if (status === 'OCCUPIED') {
        statusClass = 'occupied';
        statusLabel = 'Occupied';
      } else if (status === 'RESERVED') {
        statusClass = 'reserved';
        statusLabel = 'Reserved';
      }

      return `
        <div class="slot-bay ${statusClass}" data-id="${slot._id}" data-slot="${slot.slotNumber}" data-status="${statusClass}">
          <div class="slot-number">${slot.slotNumber}</div>
          <div class="slot-type">${slot.slotType || 'Car'}</div>
          <div class="slot-status-indicator">${statusLabel}</div>
        </div>
      `;
    }

    laneAContainer.innerHTML = laneASlots.map(renderSlotHtml).join('');
    laneBContainer.innerHTML = laneBSlots.map(renderSlotHtml).join('');

    // Attach click listeners to all rendered slot bays
    const bays = document.querySelectorAll('.slot-bay');
    bays.forEach(bay => {
      bay.addEventListener('click', () => {
        const status = bay.getAttribute('data-status');
        const slotNo = bay.getAttribute('data-slot');
        const id = bay.getAttribute('data-id');

        if (status === 'occupied') {
          window.showAlert(`Slot ${slotNo} is currently OCCUPIED. Please pick a green available bay.`, 'warning');
          return;
        }

        if (status === 'reserved') {
          window.showAlert(`Slot ${slotNo} is already RESERVED for an active booking.`, 'warning');
          return;
        }

        // Slot is available
        bays.forEach(b => b.classList.remove('selected'));
        bay.classList.add('selected');

        selectedSlotId = id;
        selectedSlotNumber = slotNo;

        if (selectedBayDisplay) {
          selectedBayDisplay.innerHTML = `<strong>Selected Slot: ${selectedSlotNumber}</strong> (Ready to reserve)`;
        }

        if (proceedBtn) {
          proceedBtn.removeAttribute('disabled');
          proceedBtn.classList.remove('btn-outline');
          proceedBtn.classList.add('btn-success');
          proceedBtn.textContent = `Proceed with Slot ${selectedSlotNumber} →`;
        }
      });
    });

  } catch (err) {
    console.error('Slot loading error:', err);
    window.showAlert('Network error fetching slots from database.', 'warning');
  }

  // Handle Proceed to Booking
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      if (!selectedSlotId || !selectedSlotNumber) {
        window.showAlert('Please select an available green parking slot bay first.', 'warning');
        return;
      }

      const bookingUrl = `booking.html?lotId=${lotId}&slotId=${selectedSlotId}&slot=${encodeURIComponent(selectedSlotNumber)}&lot=${encodeURIComponent(activeLotName)}&rate=${activeLotRate}`;
      window.location.href = bookingUrl;
    });
  }
});
