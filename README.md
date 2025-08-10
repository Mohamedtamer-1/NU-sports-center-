# 🏫 University Sports Center & Student Medical Records Management System

## 📌 Overview
This is a **web-based management system** that integrates:
1. **University Sports Center Management** – Track students, their sports activities, and schedules.
2. **Student Medical Records** – Store and manage students’ health data to ensure safe sports participation.

The system uses **Node.js/Express** for the backend, **MySQL** for databases, and **HTML/CSS/JS** for the frontend.  
It provides a **modern, responsive UI** and supports **future enhancements** like authentication and analytics.

---

## 🚀 Features

### 🏋 Sports Center Management
- Manage **students** and their **sports teams**.
- View and update **team assignments**.
- Maintain **sports schedules**.

### 🏥 Student Medical Records
- Record **medical conditions**, **surgeries**, and **injuries**.
- Track **ongoing medications** and **health habits**.
- Store **sports participation history**.

### 🎨 User Interface
- **Admin Dashboard** for centralized control.
- **Gym Schedule** page for sports planning.
- **Responsive design** for desktop & mobile.
- **Dark Mode** support for modern look.

### 📢 Notifications & Security *(Planned)*
- Admin login system for secure access.
- Email/SMS notifications for updates.

---

## 🛠 Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript
- Font Awesome Icons
- Google Fonts

**Backend:**
- Node.js with Express.js
- Body-Parser for request handling
- CORS for cross-origin requests

**Database:**
- MySQL
  - `University_sports_center`
  - `StudentMedicalRecords`

---

## 🗄 Database Structure

### **University_sports_center**
- **Students** – Student name, major, age.
- **Teams** – Team name, linked to students.

### **StudentMedicalRecords**
- **students** – Personal details & agreement signature.
- **medical_conditions** – General health issues.
- **surgeries** – Surgical history.
- **specific_conditions** – Diabetes, heart disease, blood pressure.
- **injuries_habits** – Injuries, smoking habits.
- **medications** – Ongoing medications.
- **sports** – Sports participation details.

---
