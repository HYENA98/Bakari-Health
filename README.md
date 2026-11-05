# Bakari-Health | Luxury Mobile IV Therapy 🩺💧

> **OPTIMISTIC ABOUT HEALTH. OPTIMISTIC ABOUT YOU.**

**Bakari-Health** is a premium, full-stack web application (MERN) designed for a luxury mobile IV drip service. The platform allows users to explore tailored IV therapies, understand their health benefits, and seamlessly book a nurse-administered session delivered directly to their location.

## 🚀 Live Demo

Check out the live application deployed on Render:
**[Bakari-Health Live Site](https://bakari-health.com)**

---

## Key Features (Based on Homepage UI)

*   **Hero Section:** A visually calming, luxury aesthetic featuring a high-quality background image, a pink IV drip bag, and the core value proposition: *"IV Therapy. Rehydrate. Replenish. Revive."*
*   **Clear Value Proposition:** Emphasizes *"Luxury IV drips Delivered to YOU"* to boost energy and enhance immunity, helping users feel their best inside and out.
*   **Primary Call to Action (CTA):** A prominent, high-contrast **"Book Your Drip →"** button optimized for mobile conversions.
*   **Trust Signals:** Crucial safety badges right below the CTA to build immediate credibility: `✓ Nurse-administered • Safe • Professional`.
*   **4-Pillar Benefits Grid:** A clean, icon-driven section explaining the core services:
    *   **HYDRATE:** Restore fluid balance and rehydrate your body.
    *   **REPLENISH:** Replenish essential vitamins and minerals.
    *   **BOOST:** Strengthen immunity and support overall wellness.
    *   **REVIVE:** Feel revitalized, refreshed, and ready to take on life.
*   **"Our Drips" Section:** Introduces *"Tailored IV Drips for Your [Needs]"* with a clear, user-friendly layout.
*   **Fully Responsive:** Mobile-first design, ensuring the hamburger menu, text, and buttons work flawlessly on iOS and Android devices.

---

## Tech Stack

This project is built using the **MERN Stack**, alongside core web technologies.

### **Frontend**
*   **React.js** (Component-based UI, state management)
*   **HTML5** (Semantic structure)
*   **CSS3** (Custom styling, Flexbox/Grid, responsive media queries)
*   **JavaScript (ES6+)** (Interactivity, DOM manipulation, API fetching)

### **Backend**
*   **Node.js** (Server runtime environment)
*   **Express.js** (RESTful API routing and server framework)

### **Database**
*   **MongoDB** (NoSQL database for user profiles, drip menus, and booking data)

### **Deployment**
*   **Render** (Hosting both the frontend React app and the backend Node server)

---

## Project Structure

```text
bakari-health/
│
├── frontend/                 # React Frontend
│   ├── public/
│   │   └── index.html        # Base HTML file
│   ├── src/
│   │   ├── assets/           # Images (hero, IV bags, icons)
│   │   ├── components/       # Reusable UI (Navbar, Hero, Benefits, Footer)
│   │   ├── pages/            # App pages (Home, Booking, About)
│   │   ├── App.css           # Global CSS styles
│   │   └── App.js            # Main React component
│   └── package.json
│
├── backend/                  # Node/Express Backend
│   ├── config/               # Database connection (MongoDB)
│   ├── models/               # Mongoose schemas (User, Booking, Drip)
│   ├── routes/               # API endpoints (auth, bookings)
│   ├── controllers/          # Route logic
│   ├── server.js             # Express server entry point
│   └── package.json
│
└── README.md
