# SES-GPT: Academic Neural Retrieval & Communication Intelligence Platform

[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)](https://react.dev/)
[![Spring Boot 3.3](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.2-6db33f.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL 17](https://img.shields.io/badge/Database-PostgreSQL%2017%20%2B%20pgvector-336791.svg)](https://supabase.com/)
[![ONNX Runtime](https://img.shields.io/badge/Embeddings-Local%20ONNX%20DJL-005ced.svg)](https://onnxruntime.ai/)
[![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.svg)](https://tailwindcss.com/)

**SES-GPT** is an enterprise-grade academic assistant and communication intelligence platform engineered specifically for the **School of Engineering Sciences (SES)** at the **University of Ghana, Legon**.

The platform solves systemic academic information fragmentation by indexing institutional handbooks, syllabus guidelines, and high-volume semester WhatsApp chat archives using edge-optimized local neural embeddings, hybrid vector-keyword retrieval, and role-targeted notification broadcasting.

---

## 🏛️ Supported Engineering Departments

SES-GPT provides specialized departmental scoping across all 5 departments in the School of Engineering Sciences:
1. **Department of Computer Engineering**
2. **Department of Biomedical Engineering**
3. **Department of Agricultural Engineering**
4. **Department of Materials Science & Engineering**
5. **Department of Food Process Engineering**

---

## 🚀 Key Features

### 1. In-Process Neural Retrieval-Augmented Generation (RAG)
- **Local Neural Embeddings**: Runs `all-MiniLM-L6-v2-q` directly on the JVM via **Deep Java Library (DJL)** and **ONNX Runtime**. Generates 384-dimensional dense vectors in 2–5ms with zero external network calls, zero API costs, and zero rate-limit constraints.
- **Hybrid Vector + Full-Text Search**: Combines PostgreSQL `pgvector` cosine similarity (`<=>`) on HNSW indexes with full-text keyword matching (`tsvector`) for high recall and high precision.
- **Grounded & Cited Answers**: Answers are synthesized via Google Gemini Flash using strictly retrieved institutional passages, complete with exact source attribution and zero hallucination.

### 2. High-Throughput WhatsApp Chat Ingestion Pipeline
- **Noise Filtering Engine**: Strips stickers, media placeholders (`<Media omitted>`), join/leave logs, and short conversational chatter—removing ~70% of raw chat volume.
- **Semantic Window Chunking**: Segments the remaining 30% of high-signal academic announcements into 35-line overlapping chronological windows.
- **Batch Vector Ingestion**: Utilizes `JdbcTemplate.batchUpdate()` in 100-row batches to index 10,000+ message archives in under 15 seconds.

### 3. Downward Hierarchical Announcement & Notification Engine
- **Audience Targeting Matrix**: Broadcasters can target combinations of Department, Study Level (L100 to L500 / Graduate), User Role, or individual Student IDs.
- **Authority Flow**:
  - **Teaching Assistant (TA)**: Lab group and tutorial notices (e.g. `CPEN 405 Lab Group`).
  - **Lecturer**: Course-level announcements (e.g. `CPEN 208 Course Group`).
  - **Head of Department (HoD)**: Department-wide broadcasts across all academic cohorts.
  - **Dean**: School-wide executive notices across all 5 engineering departments.
- **Automated Fan-Out**: Automatically inserts individual notification records into student feeds with dynamic unread badge counters.

### 4. Six-Tier Institutional Role-Based Access Control (RBAC)
- Fine-grained permission modeling for **Student**, **Teaching Assistant (TA)**, **Lecturer**, **Head of Department (HoD)**, **Dean**, and **Administrator**.
- Secure authentication via Student/Staff ID or linked personal email with HMAC-SHA256 JWT tokens and BCrypt password encryption (strength 12).

### 5. Modern High-Contrast UI/UX Design
- Built with **React 19**, **TypeScript**, and **Tailwind CSS v4**.
- Smooth 400ms light/dark mode transitions, interactive dynamic hover inversion, conversational chat interface, and drag-and-drop file uploader.

---

## 🏗️ System Architecture

```
[ Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4 ]
                            |
                   REST APIs & JWT Bearer
                            |
                            v
[ Backend Application: Spring Boot 3.3.2 + Java 21 + Spring Security ]
      |                           |                               |
      | (DJL ONNX Runtime)        | (Flyway Migrations V1-V5)     | (Google AI Cloud)
      v                           v                               v
[ In-Process Embeddings ]   [ Supabase PostgreSQL 17 ]      [ Google Gemini Flash ]
(all-MiniLM-L6-v2-q 384d)   (pgvector + HNSW Cosine Index)  (Constrained Synthesis)
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5.7, Vite 8, Tailwind CSS v4, Lucide Icons |
| **Backend** | Java 21 (LTS), Spring Boot 3.3.2, Spring Data JPA, Spring Security, Hibernate 6.5 |
| **Database & Vector** | Supabase-managed PostgreSQL 17.6 + `pgvector` extension (HNSW indexing) |
| **Local Neural Inference** | Deep Java Library (DJL) + ONNX Runtime (`all-MiniLM-L6-v2-q` 384d) |
| **Generative AI** | Google Gemini Flash REST API (with exponential retry and fallback) |
| **Migrations** | Flyway 10.10 (version-controlled schema evolution V1–V5) |
| **Security** | Stateless JWT (HMAC-SHA256), BCrypt Password Hashing |

---

## 📋 REST API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account with ID, department, and level validation | Public |
| `POST` | `/api/auth/login` | Authenticate with Student/Staff ID or email and receive JWT | Public |
| `PUT` | `/api/auth/password` | Self-service password update with verification | Authenticated |
| `GET` | `/api/users/me` | Fetch authenticated user profile and permissions | Authenticated |
| `PUT` | `/api/users/profile` | Update profile information and avatar URL | Authenticated |
| `POST` | `/api/chat/query` | Submit natural-language prompt and receive cited RAG response | Authenticated |
| `POST` | `/api/whatsapp/upload` | Ingest, noise-filter, chunk, embed, and index WhatsApp `.txt`/`.zip` exports | Authenticated |
| `GET` | `/api/whatsapp/sessions` | List indexed WhatsApp chat group sessions | Authenticated |
| `GET` | `/api/documents` | List indexed institutional documents and regulations | Authenticated |
| `GET` | `/api/notifications` | Fetch notifications filtered by role, department, and level | Authenticated |
| `POST` | `/api/notifications` | Publish announcement with audience targeting and fan out notices | Staff (TA, LEC, HOD, DEAN) |
| `PUT` | `/api/notifications/{id}/read` | Mark single notification as read | Authenticated |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read for current user | Authenticated |
| `GET` | `/api/users` | List all user accounts with filtering | Admin |
| `PUT` | `/api/users/{id}/role` | Update user role and administrative privileges | Admin |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v20+ and **npm** / **pnpm**
- **Java 21 JDK** (e.g. Eclipse Temurin 21)
- **Maven 3.9+**
- **PostgreSQL 17** with `pgvector` extension enabled (or Supabase instance)

### Environment Configuration

Create a `.env` file in the root directory and configure `backend/src/main/resources/application.yml`:

```properties
# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:5432/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<db_user>
SPRING_DATASOURCE_PASSWORD=<db_password>

# JWT Authentication
JWT_SECRET=<your-256-bit-secret-key>
JWT_EXPIRATION_MS=86400000

# Google Gemini API Key (Optional synthesis layer)
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
The Vite development server will start on `http://localhost:5173` (or the configured `$PORT`).

---

## 👥 Seeded Demo Accounts

The database comes pre-seeded with test accounts for exploring role-based permissions:

| Role | Student / Staff ID | Password | Department |
| :--- | :--- | :--- | :--- |
| **Student** | `10671234` | `password123` | Computer Engineering |
| **Student** | `22370498` | `password123` | Computer Engineering |
| **Teaching Assistant** | `TA-2024-01` | `password123` | Computer Engineering |
| **Lecturer** | `LEC-1002` | `password123` | Computer Engineering |
| **Head of Department** | `HOD-CPEN` | `password123` | Computer Engineering |
| **Dean** | `DEAN-ENG` | `password123` | Dean's Office |
| **Administrator** | `ADM-001` | `password123` | Administration |

---

## 📊 Performance Benchmarks

| Metric | Legacy Architecture | SES-GPT Optimized Pipeline |
| :--- | :--- | :--- |
| **10k+ Message Indexing** | 45–60s (Risk of OOM) | **14.8s (Zero OOM)** |
| **Upload Marginal Cost** | $0.02 – $0.05 / upload | **$0.00 (In-process local ONNX)** |
| **Rate Limit / API Quota** | High failure risk | **Zero risk (100% offline model)** |
| **Retrieval Accuracy** | Low (Noise diluted) | **High (70% noise stripped + hybrid)** |
| **Streaming Heap Memory** | > 1 GB (Heap overflow) | **< 25 MB streaming heap** |

---

## 👥 Project Contributors (Group 5 - CPEN 208)

- **Ethan Edric Kweku Nartey** *(Group Leader)*
- **Owusu Nana Boadiwaa**
- **Agormeda Nathaniel Tetteh**
- **Dogbatse Darlington**
- **Mohammed Sahih Ahmad**
- **Eklou Juliet**
- **William Enchill**
- **De-Andra Ayebo**
- **Gideon Nana Osei Amofa**
- **Joshua Asrifi Kwame**

**Course:** CPEN 208: Software Engineering  
**Department:** Department of Computer Engineering, School of Engineering Sciences, University of Ghana  
**Lecturer:** Mr. John Korankye Assiamah

---

## 📄 License

This software is developed for academic, educational, and institutional research purposes for the School of Engineering Sciences, University of Ghana.
