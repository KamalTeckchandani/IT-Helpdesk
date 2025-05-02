**ResolveIT – IT Helpdesk System
Modern Web-Based Ticketing System for Efficient IT Support**

🧠 **Overview**
ResolveIT is a full-stack web application developed to streamline IT support operations for universities and enterprises. Designed with scalability, security, and user experience in mind, the system allows users to submit service tickets, track progress in real-time, and enables IT administrators to manage issues efficiently. The system is integrated with email notifications, custom SLA tracking, and role-based dashboards.

This project was developed as part of IDS517 – Enterprise Application Development.

🔗 Live Demo
🔗 GitHub Repository

🚀 **Key Features**
📝 Ticket Submission: Users can log new IT issues with descriptions and attachments.

📊 Ticket Tracking: Real-time updates from submission to resolution.

🧑‍💼 Role-Based Access: Users, IT staff, supervisors, and admins have distinct capabilities.

📧 Email Integration: Automated notifications for ticket status and updates.

📈 Reporting & Analytics: Dashboards provide insights into request volumes, SLA compliance, and team performance.

🔒 Security: Includes password hashing and secure connections to Google Cloud SQL.

🧠 Knowledge Base: Integrated FAQ and self-help section to reduce ticket volume.


🏗️** System Architecture**
Frontend
Tech: HTML, CSS, JavaScript

Function: UI rendering, user interactions, AJAX-based API calls

Backend
Tech: Node.js with Express

Function: Authentication, API routing, session handling, business logic

Database
Tech: Google Cloud SQL (MySQL)

Tables: Users, ServiceRequests, Logs

Security: Password hashing, access control

🖥️** How to Run Locally**
Clone the repository:

git clone 
cd IDS517-Helpdesk-Webapp
Install dependencies:


npm install
Run the server:


npm start


Access the app:
Open your browser at http://localhost:3000

📦 **Core Modules**
Login & Authentication: Secure registration and login process

Service Request Management: Submission, viewing, and assignment of tickets

Admin Panel: Manage users and monitor SLAs

Supervisor Tools: Ticket prioritization and workload balancing

Custom SLAs: Define and track ticket resolution time

Analytics Dashboard: Visualize ticket trends and performance metrics

🧪 **Testing Strategy**
Unit Testing: Mocha + Chai (backend), Jest (frontend)

Integration Testing: Postman, Cypress

UAT: Real-world use cases by test users to validate features



📌** Future Enhancements**
Enable user feedback on ticket resolutions

AI-based ticket classification

Multilingual support

Enhanced analytics with ML-based anomaly detection

📬 **Contact If you like the project or want to collaborate, feel free to connect:**

GitHub: (https://github.com/KamalTeckchandani)

LinkedIn: https://www.linkedin.com/in/kamal-teckchandani/
