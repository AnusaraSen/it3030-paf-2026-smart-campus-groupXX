🏫 UniCore – Smart Campus Operations Hub

IT3030 – Programming Applications and Frameworks (PAF) Assignment 2026

📌 Project Overview

UniCore is a full-stack web application designed to streamline university campus operations. It provides a centralized platform to manage:

📚 Facilities & assets (rooms, labs, equipment)
📅 Booking workflows
🛠️ Maintenance & incident ticketing
🔔 Notifications
🔐 Secure authentication & role-based access

The system is built using a Spring Boot REST API and a React client application, following industry best practices such as layered architecture, RESTful design, and secure authentication.

🚀 Tech Stack
🔧 Backend
Java + Spring Boot
Spring Security (OAuth 2.0)
RESTful API
JPA / Hibernate
MySQL (or your DB)

💻 Frontend
React.js
Axios (API communication)
Tailwind / CSS (UI styling)
⚙️ DevOps & Tools
Git & GitHub
GitHub Actions (CI/CD)
Postman (API testing)

📂 System Modules

🅰️ Module A – Facilities & Assets Catalogue

👨‍💻 @chamathkaridmi

Manage campus resources (rooms, labs, equipment)
Resource metadata (capacity, type, location, availability)
Search & filtering functionality

🅱️ Module B – Booking Management

👩‍💻 @pimashi22

Booking requests with date/time & purpose
Workflow: PENDING → APPROVED / REJECTED → CANCELLED
Conflict detection (no overlapping bookings)
Admin approval system

🅲 Module C – Maintenance & Incident Ticketing

👨‍💻 @Abhisheka38

Create incident tickets with details & priority
Upload image evidence (max 3 files)
Workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED
Technician assignment & updates
Comment system

🅳 & 🅴 Module D – Notifications & Module E – Authentication

👨‍💻 @AnusaraSen

Real-time notification system
Booking & ticket updates
OAuth 2.0 login (Google Sign-In)
Role-based access control (USER / ADMIN / TECHNICIAN)
Secure API & protected routes

🔐 User Roles
USER – Request bookings, create tickets
ADMIN – Manage bookings, resources, tickets
TECHNICIAN (optional) – Handle maintenance tickets

🧩 Key Features
✅ RESTful API with proper HTTP methods
✅ Role-based authentication & authorization
✅ Conflict-free booking system
✅ Ticketing system with workflow
✅ Notification panel
✅ Clean UI/UX design
✅ Error handling & validation

🏗️ Project Structure


it3030-paf-2026-smart-campus-groupXX/
│
├── backend/        # Spring Boot API
│   ├── controller/
│   ├── service/
│   ├── repository/
│   └── model/
│
├── frontend/       # React App
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── utils/
│
├── docs/           # Diagrams & documentation
├── .github/        # GitHub Actions workflows
└── README.md

⚙️ Setup Instructions

🔹 1. Clone Repository
git clone https://github.com/your-username/it3030-paf-2026-smart-campus-groupXX.git
cd it3030-paf-2026-smart-campus-groupXX

🔹 2. Backend Setup
cd backend
mvn clean install
mvn spring-boot:run
Configure application.properties for:
Database connection
OAuth credentials

🔹 3. Frontend Setup
cd frontend
npm install
npm start

🔹 4. Access Application
Frontend: http://localhost:3000
Backend API: http://localhost:8080

🔑 Authentication
OAuth 2.0 (Google Login)
JWT-based session handling
Protected API endpoints
🧪 Testing
✔️ Postman API collections
✔️ Unit & Integration testing (Spring Boot)
✔️ Frontend validation

🔄 CI/CD
GitHub Actions configured for:
Build
Test
Continuous Integration
📊 Contribution Summary

Member	Module	Responsibility
@chamathkaridmi	Module A	Facilities & Assets
@pimashi22	Module B	Booking System
@Abhisheka38	Module C	Ticketing System
@AnusaraSen	Module D & E	Notifications + Auth

📎 Additional Features (Optional)
📊 Admin dashboard analytics
📷 QR check-in system
⏱️ Ticket SLA tracking
🔔 Notification preferences
📜 Academic Integrity

This project is developed as part of the IT3030 – PAF Assignment (SLIIT).
All members have contributed individually and are able to explain their implementations.

📬 Contact

For any issues or questions, please contact the team via GitHub.

⭐ “UniCore – Connecting Campus Operations in One Place”
