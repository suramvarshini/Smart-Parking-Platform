/**
 * Smart Parking Platform - Interactive Slot Selection Logic
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lotName = urlParams.get('lotName') || 'SRU Main Academic Block';
  const lotRate = urlParams.get('rate') || '20';

  // Display Lot Name in Heading
  const lotTitleEl = document.getElementById('selectedLotTitle');
  if (lotTitleEl) lotTitleEl.textContent = lotName;

  const lotRateEl = document.getElementById('selectedLotRate');
  if (lotRateEl) lotRateEl.textContent = `₹${lotRate} / hr`;

  let selectedSlot = null;
  const proceedBtn = document.getElementById('proceedBookingBtn');
  const selectedBayDisplay = document.getElementById('selectedBayDisplay');

  // Handle Slot Bay Click
  const slotBays = document.querySelectorAll('.slot-bay');
  slotBays.forEach(bay => {
    bay.addEventListener('click', () => {
      const status = bay.getAttribute('data-status');
      const slotNo = bay.getAttribute('data-slot');

      if (status === 'occupied') {
        window.showAlert(`Slot ${slotNo} is currently OCCUPIED by another vehicle. Please choose a green bay.`, 'warning');
        return;
      }

      if (status === 'reserved') {
        window.showAlert(`Slot ${slotNo} is already RESERVED for an upcoming booking.`, 'warning');
        return;
      }

      // Slot is available: Select it
      slotBays.forEach(b => b.classList.remove('selected'));
      bay.classList.add('selected');
      selectedSlot = slotNo;

      if (selectedBayDisplay) {
        selectedBayDisplay.innerHTML = `<strong>Selected Slot: ${selectedSlot}</strong> (Standard Car Bay)`;
      }

      if (proceedBtn) {
        proceedBtn.removeAttribute('disabled');
        proceedBtn.classList.remove('btn-outline');
        proceedBtn.classList.add('btn-success');
        proceedBtn.textContent = `Proceed with Slot ${selectedSlot} →`;
      }
    });
  });

  // Handle Proceed Button
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      if (!selectedSlot) {
        window.showAlert('Please click on an available green parking slot first.', 'warning');
        return;
      }

      const bookingUrl = `booking.html?lot=${encodeURIComponent(lotName)}&slot=${encodeURIComponent(selectedSlot)}&rate=${lotRate}`;
      window.location.href = bookingUrl;
    });
  }
});
