# SES-GPT: Academic Neural RAG Platform

SES-GPT is a specialized neural retrieval-augmented generation (RAG) and communication platform engineered specifically for the School of Engineering Sciences (SES) at the University of Ghana.

The platform provides student and faculty intelligence by indexing official academic regulations, course syllabi, semester chat archives, and department notices with high-density vector search and role-based communication tools.

---

## Supported Engineering Departments

SES-GPT supports all 5 departments within the School of Engineering Sciences:
1. Computer Engineering
2. Biomedical Engineering
3. Agricultural Engineering
4. Materials Science & Engineering
5. Food Process Engineering

---

## Core Features

- **Hybrid Neural Vector Retrieval**: Local 384-dimensional ONNX embeddings (`all-minilm-l6-v2-q`) via Deep Java Library (DJL) combined with PostgreSQL `pgvector` HNSW indexing for sub-15ms semantic search.
- **WhatsApp Semester Chat Ingestion**: Ingests and parses exported WhatsApp group chats, cleans conversational noise, and indexes vital exam schedules, lab updates, and course announcements.
- **Targeted Announcements & Broadcasts**: Broadcast notices to exact combinations of SES departments, cohort levels (L100, L200, L300, L400, L500, Graduate), user roles, or specific student IDs (e.g. `22370498`).
- **Real-Time Notification Delivery**: Automatic delivery of targeted announcements to student notification feeds, synchronized across devices with dynamic unread counters.
- **Institutional Role-Based Access Control (RBAC)**: Strict permission boundaries for Students, Teaching Assistants, Lecturers, Heads of Department (HOD), Deans, and System Administrators.
- **Modern Responsive UI**: Minimalist high-contrast interface built with React 19, TypeScript, Tailwind CSS v4, smooth 400ms light and dark mode switching, and dynamic hover color inversion.
- **Profile Customization**: In-app avatar upload with automatic client-side compression and PostgreSQL database synchronization.

---

## System Architecture

```
[ Client Browser: React 19 + TypeScript + Tailwind CSS v4 ]
                          |
                   REST APIs & JWT
                          |
                          v
[ Backend Service: Spring Boot 3.3.2 + Java 21 + Spring Security ]
     |                     |                              |
     | (DJL ONNX Runtime)  | (Flyway Migration V1-V5)     | (Optional LLM)
     v                     v                              v
[ Neural Embeddings ]  [ PostgreSQL 17 + pgvector ]   [ Google Gemini AI ]
(384-dim Quantized)    (HNSW Vector Indexing)         (Synthesis Fallback)
```

---

## Technology Stack

### Frontend
- **Framework**: React 19 and React DOM 19
- **Build Tool**: Vite 8 with `@vitejs/plugin-react`
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons & Visuals**: Inline SVG system with custom micro-animations

### Backend
- **Runtime**: Java 21 (JDK 21)
- **Framework**: Spring Boot 3.3.2
- **Security**: Spring Security with JWT stateless authentication
- **Database Driver**: PostgreSQL JDBC + Hibernate 6.5
- **Schema Management**: Flyway 10.10 (Migrations V1 through V5)
- **Neural Embeddings**: Deep Java Library (DJL) with ONNX runtime (`all-minilm-l6-v2-q`)
- **LLM Integration**: Google Gemini Flash API (optional)

### Database
- **Engine**: PostgreSQL 17 (Supabase Pooler)
- **Extensions**: `pgvector` (HNSW indexing with cosine distance)

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm / pnpm
- Java 21 JDK
- Maven 3.9+
- PostgreSQL database with `pgvector` extension enabled

### Environment Configuration

Create or update `.env` in the root directory and `backend/src/main/resources/application.yml`:

```properties
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>

# JWT Authentication
JWT_SECRET=<your-256-bit-secret-key>
JWT_EXPIRATION_MS=86400000

# Optional Google Gemini API
GEMINI_API_KEY=<your-gemini-api-key>
```

### Running the Backend

```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

The Spring Boot backend will start on `http://localhost:8080`.

### Running the Frontend

```bash
npm install
npm run dev
```

The frontend development server will start on `http://localhost:5173` (or the configured `$PORT`).

---

## Demo Accounts

The database comes pre-seeded with test accounts for testing institutional workflows:

| Role | Student / Staff ID | Default Password | Department |
| :--- | :--- | :--- | :--- |
| Student | `10671234` | `password123` | Computer Engineering |
| Student | `22370498` | `password123` | Computer Engineering |
| Teaching Assistant | `TA-2024-01` | `password123` | Computer Engineering |
| Lecturer | `LEC-1002` | `password123` | Computer Engineering |
| Head of Department | `HOD-CPEN` | `password123` | Computer Engineering |
| Dean | `DEAN-ENG` | `password123` | Dean's Office |
| Administrator | `ADM-001` | `password123` | Administration |

---

## API Summary

- `POST /api/auth/register` : User registration
- `POST /api/auth/login` : Authentication and JWT token issuance
- `GET /api/users/me` : Current user profile
- `PUT /api/users/profile` : Update profile details and avatar URL
- `POST /api/chat` : Semantic RAG query processing
- `GET /api/whatsapp/sessions` : List indexed WhatsApp group archives
- `POST /api/whatsapp/upload` : Ingest and parse `.txt` chat exports
- `GET /api/announcements` : List broadcast notices
- `POST /api/announcements` : Create announcement and fan out notifications
- `GET /api/notifications` : List notifications for authenticated student/user
- `PUT /api/notifications/{id}/read` : Mark single notification as read
- `PUT /api/notifications/read-all` : Mark all notifications as read

---

## License

SES-GPT is developed for academic and institutional use at the School of Engineering Sciences, University of Ghana.
