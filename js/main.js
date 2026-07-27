// ========================================
// ROYAL RENEWAL WELLNESS SA - MAIN JS
// ========================================

// ---------- HAMBURGER MENU ----------//
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

// ---------- NAVBAR SCROLL EFFECT ----------//
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ---------- SMOOTH SCROLL ----------//
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerHeight = header ? header.offsetHeight : 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// =========================================//
// AUTO-FILL SERVICE FROM URL PARAMETER     //
// =========================================//
const urlParams = new URLSearchParams(window.location.search);
const serviceParam = urlParams.get('service');

const serviceMap = {
    'immunity': 'emerald-elixir',
    'energy': 'regal-drip',
    'beauty': 'queendom-quench',
    'hangover': 'sunset-recovery',
    'stress': 'sky-serenity',
    'sports': 'regal-drip',
    'liquid-gold': 'liquid-gold',
    'queendom-quench': 'queendom-quench',
    'regal-drip': 'regal-drip',
    'emerald-elixir': 'emerald-elixir',
    'sky-serenity': 'sky-serenity',
    'sunset-recovery': 'sunset-recovery'
};

if (serviceParam && serviceMap[serviceParam]) {
    const serviceSelect = document.getElementById('serviceSelect');
    const mappedValue = serviceMap[serviceParam];
    for (let option of serviceSelect.options) {
        if (option.value === mappedValue) {
            option.selected = true;
            break;
        }
    }
    updateServiceDisplay();
}

// ========================================
// UPDATE SERVICE DISPLAY
// ========================================

const servicePrices = {
    'hangover-recovery': { name: 'HANGOVER RECOVERY', price: 1050 },
    'weekend-recovery': { name: 'WEEKEND RECOVERY', price: 1350 },
    'brain-boost': { name: 'BRAIN BOOST', price: 1150 },
    'athletic-recovery': { name: 'ATHLETIC RECOVERY', price: 1200 },
    'energy-booster': { name: 'ENERGY BOOSTER', price: 1050 },
    'beauty-glow': { name: 'BEAUTY GLOW', price: 1450 },
    'flu-gone': { name: 'FLU GONE', price: 950 },
    'rejuvenating': { name: 'REJUVENATING', price: 1050 },
    'skin-glow': { name: 'SKIN GLOW', price: 1250 },
    'immune-booster': { name: 'IMMUNE BOOSTER', price: 1050 },
    'rehydration': { name: 'REHYDRATION', price: 700 },
    'signature': { name: 'SIGNATURE DRIP', price: 1650 }
};

function updateServiceDisplay() {
    const select = document.getElementById('serviceSelect');
    const selectedValue = select.value;
    const nameDisplay = document.getElementById('selectedServiceName');
    const priceDisplay = document.getElementById('selectedServicePrice');
    const depositDisplay = document.getElementById('depositAmount');

    if (selectedValue && servicePrices[selectedValue]) {
        const service = servicePrices[selectedValue];
        nameDisplay.textContent = service.name;
        priceDisplay.textContent = `R${service.price.toLocaleString()}`;
        const deposit = Math.round(service.price * 0.5);
        depositDisplay.textContent = `R${deposit.toLocaleString()}`;
    } else {
        nameDisplay.textContent = 'None Selected';
        priceDisplay.textContent = 'R0';
        depositDisplay.textContent = 'R0';
    }
}

// ========================================
// BOOKING FORM SUBMISSION
// ========================================

async function handleBookingSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // Get form values
        const fullName = document.getElementById('fullName').value.trim();
        const nameParts = fullName.split(' ');
        const selectedService = document.getElementById('serviceSelect').value;

        // Validate
        if (!selectedService || !servicePrices[selectedService]) {
            alert('Please select a valid IV Drip.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
            return;
        }

        const service = servicePrices[selectedService];
        const deposit = Math.round(service.price * 0.5);

        const formData = {
            customer: {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                address: document.getElementById('address').value.trim(),
            },
            service: {
                name: service.name,
                price: service.price,
                depositAmount: deposit,
            },
            appointment: {
                date: document.getElementById('bookingDate').value,
                time: document.getElementById('bookingTime').value,
                status: 'pending',
            },
            specialRequests: document.getElementById('specialRequests').value.trim() || '',
            payment: {
                method: 'pending',
                status: 'pending',
                depositPaid: false,
            },
        };

        // Validate required fields
        if (!formData.customer.firstName || !formData.customer.email || !formData.appointment.date || !formData.appointment.time) {
            alert('Please fill in all required fields.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
            return;
        }

        console.log('📋 Creating booking...', formData);

        // Send to backend
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert('Error creating booking: ' + (result.message || 'Unknown error'));
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
            return;
        }

        console.log('✅ Booking created:', result.data);

        // ========================================
        // UPDATE SUCCESS MESSAGE WITH REFERENCE
        // ========================================

        // Show success message
        document.getElementById('bookingFormContent').style.display = 'none';
        document.getElementById('bookingSuccess').classList.add('show');

        // Update success message with booking details
        document.getElementById('successReference').textContent = result.data.reference || result.data._id;
        document.getElementById('successDeposit').textContent = result.data.service.depositAmount || 0;

        // Scroll to top of booking section
        document.querySelector('.booking-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Network error. Please check if the server is running.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
    }
}


// Set min date to today
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
});

console.log('✦ BAKARI HEALTH SA ✦');
console.log('Luxury mobile wellness services across South Africa.');