/**
 * Smart Parking Platform - Real Booking Submission & Confirmation Engine
 * SR University Web Technologies & Mobile Programming Hackathon 2026
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const lotId = urlParams.get('lotId');
  const slotId = urlParams.get('slotId');
  const lotName = urlParams.get('lot') || 'Campus Parking Facility';
  const slotNo = urlParams.get('slot') || 'A-01';
  const rate = parseInt(urlParams.get('rate') || '20', 10);

  const paramDate = urlParams.get('date');
  const paramStart = urlParams.get('startTime');
  const paramDuration = urlParams.get('duration');
  const paramVehicle = urlParams.get('vehicleType');

  // Display initial labels
  document.getElementById('summaryLot').textContent = lotName;
  document.getElementById('summarySlot').textContent = slotNo;
  document.getElementById('summaryRate').textContent = `₹${rate} / hr`;
  document.getElementById('formSlot').value = slotNo;
  document.getElementById('formLot').value = lotName;

  // Set date
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('bookingDate');
  if (dateInput) {
    dateInput.value = paramDate || today;
    dateInput.min = today;
  }

  // Set start time
  const timeInput = document.getElementById('startTime');
  if (timeInput) {
    if (paramStart) {
      timeInput.value = paramStart;
    } else {
      const now = new Date();
      const hours = String((now.getHours() + 1) % 24).padStart(2, '0');
      timeInput.value = `${hours}:00`;
    }
  }

  // Set duration
  const durationInput = document.getElementById('duration');
  if (durationInput && paramDuration) {
    durationInput.value = paramDuration;
  }

  // Set vehicle type
  const vehicleInput = document.getElementById('vehicleType');
  if (vehicleInput && paramVehicle && paramVehicle !== 'All') {
    vehicleInput.value = paramVehicle;
  }

  // Pre-fill user profile from JWT session
  try {
    const meRes = await window.authFetch('/api/auth/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData.user) {
        const nameInput = document.getElementById('driverName');
        const phoneInput = document.getElementById('contactPhone');
        const vehicleNumberInput = document.getElementById('vehicleNumber');

        if (nameInput) nameInput.value = meData.user.name || '';
        if (phoneInput) phoneInput.value = meData.user.phone || '';
        if (vehicleNumberInput && meData.user.vehicleNo) vehicleNumberInput.value = meData.user.vehicleNo;
      }
    }
  } catch (e) {
    console.error('User profile pre-fill error:', e);
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

  if (durationInput) durationInput.addEventListener('change', updateCost);
  updateCost();

  // Handle Real Form Submission
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    const driverName = document.getElementById('driverName').value.trim();
    const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
    const vehicleType = document.getElementById('vehicleType').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;

    if (!driverName || !vehicleNumber || !bookingDate || !startTime) {
      window.showAlert('Please fill in all booking details.', 'warning');
      return;
    }

    if (!lotId || !slotId) {
      window.showAlert('Missing parking facility or slot reference. Please select your slot from the layout first.', 'warning');
      setTimeout(() => window.location.href = 'parking-lots.html', 1500);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Reservation in MongoDB...';

    try {
      const res = await window.authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parkingLotId: lotId,
          parkingSlotId: slotId,
          vehicleNumber,
          vehicleType,
          bookingDate,
          startTime,
          duration
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        window.showAlert(data.error || 'Failed to complete booking reservation.', 'warning');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Reservation & Generate Digital Pass';
        return;
      }

      const booking = data.booking;

      // Populate confirmation voucher view
      const bookingView = document.getElementById('bookingView');
      const confirmationView = document.getElementById('confirmationView');

      document.getElementById('confBookingId').textContent = '#' + booking.bookingId;
      document.getElementById('confLot').textContent = booking.parkingLot ? booking.parkingLot.name : lotName;
      document.getElementById('confSlot').textContent = booking.parkingSlot ? booking.parkingSlot.slotNumber : slotNo;
      document.getElementById('confDriver').textContent = driverName;
      document.getElementById('confVehicle').textContent = `${booking.vehicleNumber} (${booking.vehicleType})`;
      document.getElementById('confSchedule').textContent = `${booking.bookingDate} | ${booking.startTime} - ${booking.endTime} (${booking.duration} hrs)`;
      document.getElementById('confTotal').textContent = `₹${booking.totalAmount}`;

      bookingView.style.display = 'none';
      confirmationView.style.display = 'block';

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Booking submission error:', err);
      window.showAlert('Network error while processing booking.', 'warning');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Reservation & Generate Digital Pass';
    }
  });
});
