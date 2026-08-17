# SES-GPT Backend: Spring Boot + PostgreSQL + pgvector + OpenAI

## Project Structure

```
ses-gpt-backend/
├── pom.xml
├── src/main/
│   ├── java/com/sesgpt/
│   │   ├── SesGptApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java          # JWT filter chain
│   │   │   ├── OpenAiConfig.java            # OpenAI client bean
│   │   │   └── CorsConfig.java
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   ├── Role.java                    # enum
│   │   │   ├── Document.java
│   │   │   ├── DocumentChunk.java           # stores embedding vector
│   │   │   ├── Conversation.java
│   │   │   ├── Message.java
│   │   │   ├── Announcement.java
│   │   │   └── WhatsAppSession.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── DocumentChunkRepository.java # custom pgvector query
│   │   │   ├── AnnouncementRepository.java
│   │   │   └── MessageRepository.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── RagService.java              # embed + retrieve + generate
│   │   │   ├── EmbeddingService.java        # OpenAI embeddings API
│   │   │   ├── WhatsAppParserService.java   # parse .txt export
│   │   │   ├── AnnouncementService.java
│   │   │   └── UserService.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── ChatController.java
│   │   │   ├── WhatsAppController.java
│   │   │   ├── AnnouncementController.java
│   │   │   └── UserController.java
│   │   ├── dto/
│   │   │   ├── RegisterRequest.java
│   │   │   ├── LoginRequest.java
│   │   │   ├── ChatRequest.java
│   │   │   ├── ChatResponse.java
│   │   │   └── AnnouncementRequest.java
│   │   └── security/
│   │       ├── JwtUtil.java
│   │       └── JwtAuthFilter.java
│   └── resources/
│       ├── application.yml
│       └── db/migration/
│           ├── V1__create_users.sql
│           ├── V2__create_documents.sql
│           ├── V3__create_chunks.sql
│           ├── V4__create_announcements.sql
│           └── V5__create_conversations.sql
```
