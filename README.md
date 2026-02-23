# To-Do-App
A robust, full-stack To-Do application built with Spring Boot 3 and Vanilla JavaScript. This project features secure JWT authentication, a sleek dark-themed UI, and an AI-driven daily productivity summarizer.

✨ **_Key Features_**

**Secure Authentication:** User registration and login powered by JSON Web Tokens (JWT) for secure session management.

**AI Daily Summary:** Integrates with Groq API (LLaMA 3.3) to generate a motivational summary of your completed tasks for the day.

**Modern UI/UX:** Responsive dashboard with Dark/Light mode support and custom frosted-glass modals for task editing and deletions.

**Full CRUD Functionality:** Create, read, update (including status toggles), and delete tasks with instant database persistence.

**Containerized Architecture:** Fully dockerized using Docker Compose, allowing the backend and MySQL database to spin up as isolated services.

🛠️ **_Tech Stack_**

**Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6)

**Backend:** Java 21, Spring Boot 3.4.2, Spring Security.

**Database:** MySQL 8.0.

**AI Engine:** Groq Cloud (LLaMA-3.3-70b-versatile).

**DevOps:** Docker, Docker Compose.

🚀 **_Getting Started (Docker - Recommended)_**

The easiest way to run this project is using Docker. Ensure Docker Desktop is running, then follow these steps:

Clone the repository:

Bash
git clone https://github.com/agnik-util/To-Do-App.git
cd To-Do-App
Set your AI API Key:

PowerShell: $env:GROQ_API_KEY="your_gsk_key_here"

CMD: set GROQ_API_KEY=your_gsk_key_here

Launch the System:

Bash
docker-compose up --build
The backend will be available at http://localhost:3030.

📂 **_Project Structure_**

/**Frontend:** All UI components, styles, and client-side logic.

/**src**: Spring Boot backend source code (Java).

**Dockerfile**: Multi-stage build configuration for the Java runtime.

**docker-compose.yml**: Orchestration for the app and MySQL services.

🛡️ **_API Security_**

All task-related endpoints are protected. To access them, a valid JWT must be provided in the Authorization header:
Authorization: Bearer <your_token>

Developed by Agnik Bandyopadhyay.
