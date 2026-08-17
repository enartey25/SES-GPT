# SES-GPT System Documentation

This document provides complete technical documentation for SES-GPT, an academic neural retrieval and communication system for the School of Engineering Sciences (SES), University of Ghana.

---

## Table of Contents

1. [Introduction and Scope](#1-introduction-and-scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Architecture and Migrations](#3-database-architecture-and-migrations)
4. [Neural Retrieval and RAG Pipeline](#4-neural-retrieval-and-rag-pipeline)
5. [WhatsApp Chat Ingestion Engine](#5-whatsapp-chat-ingestion-engine)
6. [Announcements and Notification Delivery System](#6-announcements-and-notification-delivery-system)
7. [Authentication and Role-Based Access Control](#7-authentication-and-role-based-access-control)
8. [Frontend Design System and UI Engine](#8-frontend-design-system-and-ui-engine)
9. [API Reference](#9-api-reference)
10. [Troubleshooting and Operations](#10-troubleshooting-and-operations)

---

## 1. Introduction and Scope

SES-GPT addresses the fragmentation of course information, exam schedules, project notices, and departmental communications across informal chat groups and static portal pages.

### Institutional Scope
The system operates exclusively within the School of Engineering Sciences (SES), covering all 5 academic departments:
- Department of Computer Engineering
- Department of Biomedical Engineering
- Department of Agricultural Engineering
- Department of Materials Science & Engineering
- Department of Food Process Engineering

---

## 2. Architecture Overview

SES-GPT uses a decoupled client-server architecture:

```
[ Frontend: React 19 + TypeScript + Tailwind CSS v4 ]
                        |
              REST JSON & JWT Auth
                        |
                        v
[ Backend: Spring Boot 3.3.2 + Java 21 ]
   |                    |                    |
   | (Deep Java Lib)    | (JPA + Hibernate)  | (Google AI)
   v                    v                    v
[ ONNX Model ]      [ PostgreSQL 17 ]    [ Gemini API ]
(all-minilm-l6-v2)  (pgvector + HNSW)    (Generation)
```

- **Frontend Client**: Single-page application mounting into the root DOM, supporting real-time theme swapping, smooth transitions, and instant chat switching.
- **Backend API**: Stateless Spring Boot application providing REST endpoints for authentication, chat completion, document processing, announcements, and notification synchronization.
- **Vector Database**: PostgreSQL 17 with `pgvector` storing high-density document chunks with HNSW vector indexing.

---

## 3. Database Architecture and Migrations

Database migrations are managed via Flyway (`classpath:db/migration`), using the `sesgpt_schema_history` table.

### Migration History
- `V1__init_schema.sql`: Initialized core schemas for `users`, `documents`, `document_chunks` (with `vector(384)` and HNSW index), `announcements`, `conversations`, and `messages`.
- `V2__alter_role_to_varchar.sql`: Updated user roles to standardized uppercase string representations.
- `V3__update_department_names.sql`: Standardized official SES department names across document chunks and users.
- `V4__add_avatar_url_to_users.sql`: Added `avatar_url` column to the `users` table for custom profile picture support.
- `V5__create_announcements_and_notifications_tables.sql`: Upgraded `announcements` with targeting metadata columns and created the `notifications` table with user relationships, indexes, and initial academic notices.

### Core Tables

#### `users`
- `id` (UUID, Primary Key)
- `student_id` (VARCHAR(20), Unique)
- `name` (VARCHAR(120))
- `email` (VARCHAR(160), Unique)
- `password` (VARCHAR(255), BCrypt Hash)
- `role` (VARCHAR(20): STUDENT, TA, LECTURER, HOD, DEAN, ADMIN)
- `department` (VARCHAR(120))
- `level` (VARCHAR(10): L100 to L500 / Graduate)
- `avatar_url` (TEXT)
- `verified` (BOOLEAN)
- `active` (BOOLEAN)
- `created_at` / `updated_at` (TIMESTAMPTZ)

#### `document_chunks`
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key)
- `content` (TEXT)
- `embedding` (vector(384))
- `chunk_index` (INT)
- `department` (VARCHAR(120))
- `level` (VARCHAR(20))
- `scope` (VARCHAR(50))
- `created_at` (TIMESTAMPTZ)
- **Index**: HNSW index on `embedding vector_cosine_ops` with `m = 16, ef_construction = 64`.

#### `announcements`
- `id` (UUID, Primary Key)
- `title` (TEXT)
- `body` (TEXT)
- `sender_id` (UUID, Foreign Key)
- `sender_name` (VARCHAR(255))
- `sender_role` (VARCHAR(50))
- `target_school` (VARCHAR(255))
- `target_department` (VARCHAR(255))
- `target_levels` (TEXT[])
- `target_roles` (TEXT[])
- `target_student_ids` (TEXT[])
- `reach_count` (INT)
- `created_at` (TIMESTAMPTZ)

#### `notifications`
- `id` (UUID, Primary Key)
- `announcement_id` (UUID, Foreign Key, ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key, ON DELETE CASCADE)
- `student_id` (VARCHAR(50))
- `title` (TEXT)
- `body` (TEXT)
- `sender_name` (VARCHAR(255))
- `sender_role` (VARCHAR(50))
- `department` (VARCHAR(255))
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

---

## 4. Neural Retrieval and RAG Pipeline

### Local Embedding Model
The system uses the Deep Java Library (DJL) ONNX runtime with `all-minilm-l6-v2-q` running entirely in-process on the JVM:
- **Dimensions**: 384 dimensions
- **Inference Latency**: 2 to 5 milliseconds per query
- **Quantization**: Int8 quantized weights for minimal memory consumption

### Retrieval Strategy
1. **Query Normalization**: User prompt is normalized and passed through a typo-correction service.
2. **Dense Vector Search**: The query is embedded and executed against `document_chunks` using cosine distance (`<=>` operator in PostgreSQL).
3. **Department Filtering**: Retrieval prioritizes chunks tagged with the user's specific department before falling back to general school-wide regulations.
4. **Vector Neighborhood Cache**: Session-aware caching retains vector neighborhoods for active query topics to accelerate multi-turn conversations.
5. **Synthesis**: Context chunks are combined with system constraints to generate factual, source-attributed responses.

---

## 5. WhatsApp Chat Ingestion Engine

The WhatsApp ingestion service (`WhatsAppIngestionService.java`) enables lecturers, class reps, and TAs to upload raw `.txt` chat exports.

### Processing Pipeline
1. **Regex Parsing**: Identifies message lines containing timestamps, senders, and content.
2. **Noise Filtering**: Automatically drops media omitted placeholders, system notifications, deleted message markers, and short conversational chatter (e.g. "ok", "thanks", "lol").
3. **Semantic Chunking**: Groups contextual clusters of academic announcements, course timetables, exam room notices, and project deadlines into chunks with metadata tags.
4. **Embedding Generation**: Chunks are embedded through the ONNX engine and stored directly into `document_chunks` associated with the uploaded document record.

---

## 6. Announcements and Notification Delivery System

The Announcements engine (`AnnouncementsPage.tsx` + `AnnouncementController.java`) provides multi-tier audience targeting.

### Targeting Matrix
Broadcasters can target recipients using any combination of:
- **Department**: Target a single engineering department or all 5 SES departments.
- **Year Cohort Levels**: Multi-select L100, L200, L300, L400, L500, or Graduate.
- **User Roles**: Multi-select Students, TAs, Lecturers, HODs, or Deans.
- **Specific Student IDs**: Optional targeting for individual student IDs (e.g. `22370498`).

### Automated Fan-Out Delivery
When `POST /api/announcements` is called:
1. The announcement record is persisted in PostgreSQL.
2. The backend queries registered users matching the targeting filters.
3. Individual `NotificationEntity` rows are inserted into `notifications` for all matching recipients.
4. When recipient clients poll or log in, `GET /api/notifications?studentId=...` delivers their unread notices and increments their sidebar badge.

---

## 7. Authentication and Role-Based Access Control

### Security Configuration
- Stateless session management (`SessionCreationPolicy.STATELESS`).
- Passwords hashed using BCrypt (strength factor 12).
- Authentication via JSON Web Tokens (JWT) signed with HMAC-SHA256.

### Permission Hierarchy
- **Student**: Access to neural RAG assistant, personal notifications, document queries, and profile editing.
- **Teaching Assistant (TA)**: Student capabilities plus departmental announcements broadcasting.
- **Lecturer**: Course syllabus ingestion, exam timetable broadcasting, and class communication.
- **Head of Department (HOD)**: Department-wide announcements, TA oversight, and user verification.
- **Dean**: School-wide broadcasts across all 5 engineering departments.
- **Admin**: Full administrative privileges including user role modifications, status suspension, and system diagnostics.

---

## 8. Frontend Design System and UI Engine

### Design Tokens
- **Light Mode Canvas**: `#f5f5f5`
- **Light Mode Cards**: `#ffffff` with subtle borders (`#d9d9d9`, `#e5e5e5`)
- **Light Mode Text**: Primary `#1e1e1e`, Secondary `#757575`
- **Dark Mode Canvas**: `#121214`
- **Dark Mode Cards**: `#18181c` with subtle borders (`#2e2e34`)
- **Dark Mode Text**: Primary `#f3f4f6`, Secondary `#a1a1aa`
- **Typography**: Inter (sans-serif) for high readability across all resolutions.

### Dynamic Inversion System
- Global transitions timed to `400ms cubic-bezier(0.4, 0, 0.2, 1)`.
- Interactive `.card-hover` elements dynamically flip background and text contrast on mouse hover.
- Theme defaults unconditionally to Light Mode on first visit, preserving user preferences in `localStorage`.

---

## 9. API Reference

### Authentication
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate credentials and receive JWT.

### Users
- `GET /api/users/me`: Retrieve profile of currently authenticated user.
- `PUT /api/users/profile`: Update user profile details and profile picture URL.
- `GET /api/users`: List all users (Admin only).
- `PUT /api/users/{id}/role`: Change user role (Admin only).

### Neural Chat and Documents
- `POST /api/chat`: Submit prompt and receive retrieval-augmented response.
- `GET /api/whatsapp/sessions`: Retrieve indexed document sessions.
- `POST /api/whatsapp/upload`: Upload and index WhatsApp chat archive.

### Announcements and Notifications
- `GET /api/announcements`: Retrieve all historical broadcasts.
- `POST /api/announcements`: Publish announcement and fan out notifications.
- `GET /api/notifications?studentId={id}`: Fetch notifications for specific user.
- `PUT /api/notifications/{id}/read`: Mark notification as read.
- `PUT /api/notifications/read-all`: Mark all notifications as read for student.

---

## 10. Troubleshooting and Operations

### Database Connection Issues
If Flyway or Hibernate fails to connect:
1. Verify Supabase connection string and SSL mode (`sslmode=require`).
2. Ensure `pgvector` extension is created in the database (`CREATE EXTENSION IF NOT EXISTS vector;`).
3. Check `application.yml` Flyway migration strategy settings.

### ONNX Runtime Memory
The local ONNX embedding engine initializes upon backend startup. Ensure the host environment provides at least 512MB of available JVM heap memory.

### Frontend Production Build
To test or create a production bundle:
```bash
npm run build
```
The output will be generated in the `dist/` directory.
