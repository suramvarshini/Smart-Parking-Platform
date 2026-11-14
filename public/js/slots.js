/**
 * Smart Parking Platform - Interactive Slot Selection Logic (Time Window Aware)
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
  const selectedBayMeta = document.getElementById('selectedBayMeta');

  // Time filter inputs
  const dateInput = document.getElementById('timeFilterDate');
  const startInput = document.getElementById('timeFilterStart');
  const durationInput = document.getElementById('timeFilterDuration');
  const vehicleInput = document.getElementById('timeFilterVehicle');
  const checkBtn = document.getElementById('btnCheckAvailability');

  // Initialize default date & time
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }

  if (startInput) {
    const now = new Date();
    const nextHour = String((now.getHours() + 1) % 24).padStart(2, '0');
    startInput.value = `${nextHour}:00`;
  }

  let selectedSlotId = null;
  let selectedSlotNumber = null;
  let activeLotRate = fallbackRate;
  let activeLotName = fallbackLotName;

  if (!lotId) {
    window.showAlert('No parking facility selected. Redirecting to lots directory...', 'warning');
    setTimeout(() => window.location.href = 'parking-lots.html', 1500);
    return;
  }

  // Load and render slots for selected time window
  async function fetchAndRenderSlots() {
    const date = dateInput ? dateInput.value : todayStr;
    const startTime = startInput ? startInput.value : '10:00';
    const duration = durationInput ? durationInput.value : '2';
    const vehicleType = vehicleInput ? vehicleInput.value : 'All';

    laneAContainer.innerHTML = '<div style="padding:20px; color:var(--text-muted);">Checking database for conflicts...</div>';
    laneBContainer.innerHTML = '<div style="padding:20px; color:var(--text-muted);">Checking database for conflicts...</div>';

    // Reset selection
    selectedSlotId = null;
    selectedSlotNumber = null;
    if (selectedBayDisplay) selectedBayDisplay.innerHTML = '<em>Click any green bay above to select</em>';
    if (proceedBtn) {
      proceedBtn.disabled = true;
      proceedBtn.className = 'btn btn-outline';
      proceedBtn.textContent = 'Select an Available Slot to Continue';
    }

    try {
      const url = `/api/parking-lots/${lotId}/slots?date=${date}&startTime=${startTime}&duration=${duration}&vehicleType=${vehicleType}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        window.showAlert(data.error || 'Failed to retrieve slot availability from database.', 'warning');
        return;
      }

      activeLotName = data.lotName || fallbackLotName;
      activeLotRate = data.hourlyRate || fallbackRate;

      if (lotTitleEl) lotTitleEl.textContent = activeLotName;
      if (lotRateEl) lotRateEl.textContent = `₹${activeLotRate} / hr`;

      const slots = data.slots || [];

      if (slots.length === 0) {
        laneAContainer.innerHTML = '<div style="padding:20px; color:var(--text-muted);">No slots found for this vehicle category.</div>';
        laneBContainer.innerHTML = '<div style="padding:20px; color:var(--text-muted);">No slots found for this vehicle category.</div>';
        return;
      }

      const laneASlots = slots.filter(s => s.slotNumber.startsWith('A-'));
      const laneBSlots = slots.filter(s => s.slotNumber.startsWith('B-'));

      const availCountA = laneASlots.filter(s => (s.dynamicStatus || s.status) === 'AVAILABLE').length;
      const availCountB = laneBSlots.filter(s => (s.dynamicStatus || s.status) === 'AVAILABLE').length;

      const countBadgeA = document.getElementById('laneACountBadge');
      if (countBadgeA) countBadgeA.textContent = `${availCountA} Open for this Time`;

      const countBadgeB = document.getElementById('laneBCountBadge');
      if (countBadgeB) countBadgeB.textContent = `${availCountB} Open for this Time`;

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

      // Attach click events
      const bays = document.querySelectorAll('.slot-bay');
      bays.forEach(bay => {
        bay.addEventListener('click', () => {
          const status = bay.getAttribute('data-status');
          const slotNo = bay.getAttribute('data-slot');
          const id = bay.getAttribute('data-id');

          if (status === 'occupied') {
            window.showAlert(`Slot ${slotNo} is currently OCCUPIED or closed for maintenance.`, 'warning');
            return;
          }

          if (status === 'reserved') {
            window.showAlert(`Slot ${slotNo} is already RESERVED for the chosen time (${date} ${startTime}). Please select an open green bay.`, 'warning');
            return;
          }

          // Available slot clicked
          bays.forEach(b => b.classList.remove('selected'));
          bay.classList.add('selected');

          selectedSlotId = id;
          selectedSlotNumber = slotNo;

          const estCost = Number(duration) * activeLotRate;

          if (selectedBayDisplay) {
            selectedBayDisplay.innerHTML = `<strong>Selected Slot: ${selectedSlotNumber}</strong> (${date} | ${startTime} for ${duration} hrs)`;
          }

          if (selectedBayMeta) {
            selectedBayMeta.innerHTML = `Estimated Amount: <strong>₹${estCost}</strong> (Guaranteed bay hold)`;
          }

          if (proceedBtn) {
            proceedBtn.removeAttribute('disabled');
            proceedBtn.className = 'btn btn-success';
            proceedBtn.textContent = `Proceed with Slot ${selectedSlotNumber} (₹${estCost}) →`;
          }
        });
      });

    } catch (err) {
      console.error('Fetch slots error:', err);
      window.showAlert('Network error communicating with database.', 'warning');
    }
  }

  // Hook Check Availability button
  if (checkBtn) {
    checkBtn.addEventListener('click', fetchAndRenderSlots);
  }

  // Also re-check when inputs change
  if (dateInput) dateInput.addEventListener('change', fetchAndRenderSlots);
  if (startInput) startInput.addEventListener('change', fetchAndRenderSlots);
  if (durationInput) durationInput.addEventListener('change', fetchAndRenderSlots);
  if (vehicleInput) vehicleInput.addEventListener('change', fetchAndRenderSlots);

  // Initial load
  await fetchAndRenderSlots();

  // Proceed button click
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      if (!selectedSlotId || !selectedSlotNumber) {
        window.showAlert('Please select an available green parking slot first.', 'warning');
        return;
      }

      const date = dateInput ? dateInput.value : todayStr;
      const startTime = startInput ? startInput.value : '10:00';
      const duration = durationInput ? durationInput.value : '2';
      const vehicleType = vehicleInput ? vehicleInput.value : 'Car';

      const bookingUrl = `booking.html?lotId=${lotId}&slotId=${selectedSlotId}&slot=${encodeURIComponent(selectedSlotNumber)}&lot=${encodeURIComponent(activeLotName)}&rate=${activeLotRate}&date=${date}&startTime=${startTime}&duration=${duration}&vehicleType=${vehicleType}`;
      window.location.href = bookingUrl;
    });
  }
});
