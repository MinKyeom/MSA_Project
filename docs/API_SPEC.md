# API 명세서 (PRD / DEV 공통)

본 문서는 **PRD(운영)** 과 **DEV(개발)** 환경에서 공통으로 사용하는 REST API 명세입니다.  
엔드포인트 경로와 요청/응답 형식은 동일하며, **Base URL**만 환경별로 다릅니다.

---

## Base URL 정리

| 환경 | Auth | User | Post | Chat (AI) |
|------|------|------|------|-----------|
| **DEV** | `http://localhost:9085` | `http://localhost:9085` | `http://localhost:9085` | `http://localhost:9085` |
| **PRD** | `http://localhost:8084` | `http://localhost:8081` | `http://localhost:8082` | `http://localhost:8000` |

- **DEV**: API Gateway 하나(9085)로 모든 경로 라우팅 (`/auth/**`, `/user/**`, `/api/posts/**`, `/chat/**`).
- **PRD**: 서비스별로 위 포트에 직접 요청. (실제 운영 시 Nginx 등에서 하나의 도메인으로 묶을 수 있음.)

---

## 인증 (Auth Service)

Base: **DEV** `{GATEWAY}/auth` · **PRD** `http://localhost:8084/auth`

### 1. 인증번호 발송

이메일로 인증번호를 발송합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/auth/send-code` |
| **Content-Type** | `application/json` |
| **Request Body** | `{ "email": "user@example.com" }` |
| **Response** | `200 OK` (body 없음) |

---

### 2. 인증번호 검증

발송한 인증번호가 맞는지 확인합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/auth/verify-code` |
| **Request Body** | `{ "email": "user@example.com", "code": "123456" }` |
| **Response** | `200 OK` (성공) / `400 Bad Request` (실패 시 "인증번호가 일치하지 않습니다." 등) |

---

### 3. 회원가입

이메일 인증 후 회원가입을 완료합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/auth/signup` |
| **Request Body** | `SignupRequest` (JSON) |

**SignupRequest**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| username | string | O | 3자 이상 |
| password | string | O | 8~20자 |
| nickname | string | O | 닉네임 |
| email | string | O | 이메일 형식 |

**Response** `200 OK`

```json
{
  "id": "uuid",
  "username": "string",
  "token": "JWT_STRING"
}
```

---

### 4. 로그인

로그인 성공 시 JWT를 **HttpOnly Cookie**로 설정하고 사용자 식별자 등을 반환합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/auth/login` |
| **Request Body** | `{ "username": "string", "password": "string" }` |
| **Response** | `200 OK` + `Set-Cookie: authToken=...` |

**Response Body**

```json
{
  "id": "uuid",
  "username": "string",
  "token": "JWT_STRING"
}
```

- 클라이언트는 이후 요청에 `withCredentials: true`로 쿠키를 자동 전송하면 됩니다.

---

### 5. 로그아웃

쿠키에 담긴 토큰을 제거합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/auth/logout` |
| **Cookie** | `authToken` (있으면 제거) |
| **Response** | `200 OK` |

---

## 사용자 (User Service)

Base: **DEV** `{GATEWAY}/user` · **PRD** `http://localhost:8081/user`

### 1. 아이디(Username) 중복 체크

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/user/check-username` |
| **Query** | `username` (string) |
| **Response** | `200 OK` → `true`(중복) / `false`(사용 가능) |

---

### 2. 닉네임 중복 체크

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/user/check-nickname` |
| **Query** | `nickname` (string) |
| **Response** | `200 OK` → `true`(중복) / `false`(사용 가능) |

---

### 3. 내 정보 조회 (Me)

로그인한 사용자 정보를 반환합니다. **인증 필요** (Cookie에 JWT).

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/user/me` |
| **Cookie** | `authToken` (JWT) |
| **Response** | `200 OK` → `UserResponse` |

**UserResponse**

```json
{
  "id": "string",
  "username": "string",
  "nickname": "string",
  "email": "string"
}
```

- 미인증 시 `401 Unauthorized`.

---

### 4. 사용자 ID 목록 → 닉네임 맵

여러 사용자 ID에 대한 닉네임을 한 번에 조회합니다.

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/user/api/users/nicknames` |
| **Request Body** | `["userId1", "userId2", ...]` (문자열 배열) |
| **Response** | `200 OK` → `{ "userId1": "닉네임1", "userId2": "닉네임2", ... }` |

---

## 게시글 (Post Service)

Base: **DEV** `{GATEWAY}/api/posts` · **PRD** `http://localhost:8082/api/posts`

### 1. 게시글 목록 조회 (페이징)

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts` |
| **Query** | `page` (기본 0), `size` (기본 10) |
| **Response** | `200 OK` → Spring `Page<PostResponse>` (content, totalElements, totalPages 등) |

**PostResponse** (목록/상세 공통)

```json
{
  "id": 1,
  "title": "string",
  "content": "string",
  "authorId": "string",
  "authorNickname": "string",
  "createdAt": "yyyy-MM-ddTHH:mm:ss",
  "categoryName": "string",
  "tagNames": ["tag1", "tag2"]
}
```

---

### 2. 게시글 상세 조회

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/{id}` |
| **Response** | `200 OK` → `PostResponse` |

---

### 3. 게시글 작성

**인증 필요.**

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/api/posts` |
| **Request Body** | `PostRequest` (JSON) |

**PostRequest**

| 필드 | 타입 | 설명 |
|------|------|------|
| title | string | 제목 |
| content | string | 본문 (마크다운 등) |
| categoryName | string | 카테고리 이름 |
| tagNames | string[] | 태그 이름 배열 |

**Response** `200 OK` → `PostResponse`

---

### 4. 게시글 수정

**인증 필요.** 본인 글만 수정 가능.

| 항목 | 내용 |
|------|------|
| **Method** | `PUT` |
| **URL** | `/api/posts/{id}` |
| **Request Body** | `PostRequest` (동일) |
| **Response** | `200 OK` → `PostResponse` |

---

### 5. 게시글 삭제

**인증 필요.** 본인 글만 삭제 가능.

| 항목 | 내용 |
|------|------|
| **Method** | `DELETE` |
| **URL** | `/api/posts/{id}` |
| **Response** | `200` / `204` (body 없음) |

---

### 6. 카테고리별 게시글 목록

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/category` |
| **Query** | `name` (카테고리명), `page`, `size` |
| **Response** | `200 OK` → `Page<PostResponse>` |

---

### 7. 태그별 게시글 목록

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/tag` |
| **Query** | `name` (태그명), `page`, `size` |
| **Response** | `200 OK` → `Page<PostResponse>` |

---

### 8. 카테고리 목록 (이름 + 개수)

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/categories` |
| **Response** | `200 OK` → `List<CategoryResponse>` |

**CategoryResponse** (예시)

```json
{ "name": "string", "postCount": 0 }
```

---

### 9. 태그 목록 (이름 + 개수)

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/tags` |
| **Response** | `200 OK` → `List<TagResponse>` |

**TagResponse** (예시)

```json
{ "name": "string", "postCount": 0 }
```

---

## 댓글 (Post Service 내)

Base: **DEV** `{GATEWAY}/api/posts` · **PRD** `http://localhost:8082/api/posts`

### 1. 댓글 목록 조회

| 항목 | 내용 |
|------|------|
| **Method** | `GET` |
| **URL** | `/api/posts/{postId}/comments` |
| **Response** | `200 OK` → `List<CommentResponse>` |

**CommentResponse**

```json
{
  "id": 1,
  "content": "string",
  "authorId": "string",
  "authorNickname": "string",
  "createdAt": "yyyy-MM-ddTHH:mm:ss"
}
```

---

### 2. 댓글 작성

**인증 필요.**

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/api/posts/{postId}/comments` |
| **Request Body** | `{ "content": "string" }` |
| **Response** | `200 OK` → `CommentResponse` |

---

### 3. 댓글 수정

**인증 필요.** 본인 댓글만 수정 가능.

| 항목 | 내용 |
|------|------|
| **Method** | `PUT` |
| **URL** | `/api/posts/comments/{commentId}` |
| **Request Body** | `{ "content": "string" }` |
| **Response** | `200 OK` → `CommentResponse` |

---

### 4. 댓글 삭제

**인증 필요.** 본인 댓글만 삭제 가능.

| 항목 | 내용 |
|------|------|
| **Method** | `DELETE` |
| **URL** | `/api/posts/comments/{commentId}` |
| **Response** | `200` / `204` (body 없음) |

---

## 챗봇 (FastAPI AI)

Base: **DEV** `{GATEWAY}/chat` · **PRD** `http://localhost:8000`

### 1. 채팅 메시지 전송

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | `/chat` (DEV: `/chat` → Gateway가 `/chat`로 라우팅) |
| **Content-Type** | `application/json` |
| **Request Body** | `ChatPayload` |

**ChatPayload**

| 필드 | 타입 | 설명 |
|------|------|------|
| session_id | string | 세션 식별자 (예: 사용자 ID 또는 UUID) |
| message | string | 사용자 메시지 |

**Response** `200 OK`

```json
{
  "response": "AI 응답 메시지 문자열"
}
```

---

### 2. 채팅 세션 초기화

| 항목 | 내용 |
|------|------|
| **Method** | `POST` |
| **URL** | **PRD** `http://localhost:8000/clear` · **DEV** `http://localhost:9085/chat/clear` (Gateway가 `/chat/**`로 AI 서비스에 전달하므로, FastAPI에서 `/chat/clear` 라우트를 두거나 Gateway에서 `/clear`를 별도 라우트로 두어 사용) |
| **Request Body** | `{ "session_id": "string", "message": "" }` (ChatPayload와 동일, message는 빈 문자열 가능) |
| **Response** | `200 OK` → `{ "message": "기록이 초기화되었습니다." }` |

---

## 공통 사항

### 인증이 필요한 API

- Cookie `authToken` (JWT) 필요: 로그인/로그아웃 제외한 User/Post/Comment 쓰기·수정·삭제 및 `/user/me`.
- 요청 시 `withCredentials: true` (또는 동일 도메인)로 쿠키가 전송되어야 합니다.

### CORS

- DEV Gateway와 각 서비스에서 운영/개발 도메인 및 `localhost:3000`, `localhost:4000` 등이 허용되어 있습니다.
- 실제 도메인은 `application.yml`(Gateway)·각 서비스 설정에서 확인하세요.

### 에러 응답

- `400`: 잘못된 요청 (검증 실패 등)
- `401`: 미인증
- `403`: 권한 없음 (타인 글/댓글 수정·삭제 등)
- `404`: 리소스 없음
- `500`: 서버 내부 오류

---

이 명세는 코드베이스 기준으로 작성되었으며, PRD/DEV 모두 동일한 API를 제공합니다. Base URL만 위 표와 같이 바꿔 사용하면 됩니다.
