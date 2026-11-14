/**
 * Smart Parking Platform - Booking Page Logic
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lot = urlParams.get('lot') || 'SRU Main Academic Block';
  const slot = urlParams.get('slot') || 'A-01';
  const rate = parseInt(urlParams.get('rate') || '20', 10);

  // Set default values in summary & inputs
  document.getElementById('summaryLot').textContent = lot;
  document.getElementById('summarySlot').textContent = slot;
  document.getElementById('summaryRate').textContent = `₹${rate} / hr`;
  document.getElementById('formSlot').value = slot;
  document.getElementById('formLot').value = lot;

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
  }

  // Set default start time to next round hour
  const timeInput = document.getElementById('startTime');
  if (timeInput) {
    const now = new Date();
    const hours = String((now.getHours() + 1) % 24).padStart(2, '0');
    timeInput.value = `${hours}:00`;
  }

  // Cost calculator
  function updateCost() {
    const duration = parseInt(document.getElementById('duration').value, 10) || 1;
    const subtotal = duration * rate;
    const total = subtotal;

    document.getElementById('summaryDuration').textContent = `${duration} Hour${duration > 1 ? 's' : ''}`;
    document.getElementById('summarySubtotal').textContent = `₹${subtotal}`;
    document.getElementById('summaryTotal').textContent = `₹${total}`;
  }

  document.getElementById('duration').addEventListener('change', updateCost);
  updateCost();

  // Handle Form Submission
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const driverName = document.getElementById('driverName').value.trim();
    const vehicleNo = document.getElementById('vehicleNumber').value.trim();
    const bookingDate = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;
    const totalCost = document.getElementById('summaryTotal').textContent;

    if (!driverName || !vehicleNo || !bookingDate || !startTime) {
      window.showAlert('Please fill in all booking details.', 'warning');
      return;
    }

    // Hide form and show Confirmation Voucher
    const bookingView = document.getElementById('bookingView');
    const confirmationView = document.getElementById('confirmationView');

    const bookingId = 'BK-' + Math.floor(1000 + Math.random() * 9000);

    document.getElementById('confBookingId').textContent = '#' + bookingId;
    document.getElementById('confLot').textContent = lot;
    document.getElementById('confSlot').textContent = slot;
    document.getElementById('confDriver').textContent = driverName;
    document.getElementById('confVehicle').textContent = vehicleNo;
    document.getElementById('confSchedule').textContent = `${bookingDate} at ${startTime} (${duration} hrs)`;
    document.getElementById('confTotal').textContent = totalCost;

    bookingView.style.display = 'none';
    confirmationView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
