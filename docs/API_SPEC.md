# MinKowskiM API 명세서

코드베이스 및 `nginx/sites-available/msa-project` 기준으로 노출되는 API 엔드포인트 명세입니다.  
클라이언트는 **동일 오리진**(예: `https://minkowskim.com`)으로 요청하며, Nginx가 `/user/`, `/auth/`, `/api/posts`, `/api/search`, `/chat`, `/actuator`를 API Gateway(8085)로 프록시합니다.

---

## 공통 사항

| 항목 | 설명 |
|------|------|
| **Base URL** | 운영: `https://minkowskim.com` / 개발: `https://dev.minkowskim.com` (또는 `NEXT_PUBLIC_*_API_URL`) |
| **인증** | 쿠키 `authToken`(JWT) 또는 `Authorization: Bearer <token>`. .auth, /user, /api/posts(쓰기), 댓글 쓰기/수정/삭제 등에서 필요 |
| **CORS** | Nginx·Gateway에서 Origin/Cookie 전달. credentials: true 사용 시 쿠키 전송 |

---

## 1. Auth API (`/auth/**`)

인증 서비스 (Auth Service, context-path: `/auth`). Gateway가 `/auth`, `/auth/**` 를 auth-service(8084)로 라우팅합니다.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/auth/send-code` | 이메일 인증번호 발송 | X |
| POST | `/auth/verify-code` | 인증번호 검증 | X |
| POST | `/auth/signup` | 회원가입 | X |
| POST | `/auth/login` | 로그인 (액세스·리프레시 토큰 쿠키 설정) | X |
| POST | `/auth/logout` | 로그아웃 (쿠키 삭제) | O |
| POST | `/auth/refresh` | 리프레시 토큰으로 액세스 토큰 재발급 | 쿠키 또는 X-Refresh-Token |
| POST | `/auth/extend` | 액세스 토큰으로 세션 연장 (만료 직전 grace 허용) | O |

### Request Body

**POST /auth/send-code**
```json
{ "email": "user@example.com" }
```

**POST /auth/verify-code**
```json
{ "email": "user@example.com", "code": "123456" }
```

**POST /auth/signup**
```json
{
  "username": "userId",      // 3자 이상
  "password": "password",    // 8~20자
  "nickname": "닉네임",
  "email": "user@example.com"
}
```

**POST /auth/login**
```json
{ "username": "userId", "password": "password" }
```

### Response (예시)

- **signup / login**: `{ "id": "uuid", "username": "userId", "token": "jwt..." }` (토큰은 쿠키에도 설정됨)
- **refresh / extend**: 동일 형태
- **send-code / verify-code / logout**: 200 OK (body 없거나 message)

---

## 2. User API (`/user/**`)

사용자 서비스 (User Service). Gateway가 `/user`, `/user/**` 를 user-service(8081)로 라우팅합니다.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/user/me` | 현재 로그인 사용자 정보 | O |
| GET | `/user/check-username` | 아이디(username) 중복 여부 | X |
| GET | `/user/check-nickname` | 닉네임 중복 여부 | X |
| POST | `/user/api/users/nicknames` | 여러 사용자 ID로 닉네임 맵 조회 | O |

### Query / Body

- **GET /user/check-username**: `?username=값`
- **GET /user/check-nickname**: `?nickname=값`
- **POST /user/api/users/nicknames**: `["userId1", "userId2"]` (JSON 배열)

### Response (예시)

- **/user/me**: `{ "id": "uuid", "username": "...", "nickname": "...", "email": "..." }`
- **check-username / check-nickname**: `true`(존재) / `false`(미존재)
- **/user/api/users/nicknames**: `{ "userId1": "닉네임1", "userId2": "닉네임2" }`

---

## 3. Post API (`/api/posts`, `/api/posts/**`)

게시글·카테고리·태그 (Post Service). Gateway가 `/api/posts`, `/api/posts/**` 를 post-service(8082)로 라우팅합니다.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/posts` | 게시글 목록 (페이징) | X |
| GET | `/api/posts/{id}` | 게시글 단건 조회 | X |
| POST | `/api/posts` | 게시글 작성 | O |
| PUT | `/api/posts/{id}` | 게시글 수정 | O |
| DELETE | `/api/posts/{id}` | 게시글 삭제 | O |
| GET | `/api/posts/category` | 카테고리별 목록 | X |
| GET | `/api/posts/tag` | 태그별 목록 | X |
| GET | `/api/posts/categories` | 카테고리 목록(건수 포함) | X |
| GET | `/api/posts/tags` | 태그 목록(건수 포함) | X |

### Query

- **GET /api/posts**: `?page=0&size=10` (기본: page=0, size=10, id 내림차순)
- **GET /api/posts/category**: `?name=카테고리명&page=0&size=10`
- **GET /api/posts/tag**: `?name=태그명&page=0&size=10`

### Request Body (POST/PUT)

```json
{
  "title": "제목",
  "content": "본문 마크다운",
  "categoryName": "카테고리명",
  "tagNames": ["태그1", "태그2"]
}
```

### Response (예시)

- **GET /api/posts**: `{ "content": [ PostResponse... ], "totalElements", "totalPages", "size", "number" }` (Spring Page)
- **GET /api/posts/{id}**: 단일 PostResponse
- **POST/PUT /api/posts**: PostResponse
- **GET /api/posts/categories**: `[{ "name": "...", "postCount": n }, ...]`
- **GET /api/posts/tags**: `[{ "name": "...", "postCount": n }, ...]`

---

## 4. Comment API (`/api/posts/**`)

댓글 (Post Service 내 CommentController). 동일하게 `/api/posts` 경로로 Gateway → post-service(8082)입니다.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/posts/{postId}/comments` | 해당 게시글 댓글 목록 | X |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 | O |
| PUT | `/api/posts/comments/{commentId}` | 댓글 수정 | O |
| DELETE | `/api/posts/comments/{commentId}` | 댓글 삭제 | O |

### Request Body (POST/PUT)

```json
{ "content": "댓글 내용" }
```

---

## 5. Search API (`/api/search`, `/api/search/**`)

의미 검색 (Search Service, FastAPI). Gateway가 `/api/search`, `/api/search/**` 를 search-service(8010)로 라우팅합니다.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/search` | 의미 기반 검색 (쿼리 임베딩 유사도) | X |
| GET | `/api/search/related` | 특정 게시글과 유사한 연관 포스트 | X |

### Query

- **GET /api/search**: `?q=검색어&limit=10` (limit 1~50, 기본 10)
- **GET /api/search/related**: `?post_id=1&limit=5` (limit 1~20, 기본 5)

### Response (예시)

**GET /api/search**
```json
{
  "query": "검색어",
  "results": [
    { "postId": 1, "title": "...", "snippet": "...", "score": 0.9234 }
  ]
}
```

**GET /api/search/related**
```json
{
  "postId": 1,
  "results": [
    { "postId": 2, "title": "...", "snippet": "...", "score": 0.85 }
  ]
}
```

---

## 6. Chat API (`/chat`, `/chat/**`)

AI 챗봇 (FastAPI). Gateway가 `/chat`, `/chat/**` 를 fastapi-ai(8000)로 라우팅합니다.  
Nginx 설정: `location /chat` → msa-gateway.

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/chat/health` 또는 `/health` | 챗봇 헬스체크 (LLM 설정 여부 포함) | X |
| POST | `/chat` | 채팅 메시지 전송 → AI 응답 | X |
| POST | `/chat/clear` 또는 `/clear` | 세션 대화 기록 초기화 | X |

### Request Body (POST /chat, /chat/clear, /clear)

```json
{
  "session_id": "user_001",
  "message": "사용자 메시지"
}
```

- **POST /chat**: `message` 필수. `session_id`로 세션 구분(기본 "user_001").
- **POST /chat/clear**, **POST /clear**: `session_id`만 사용해 해당 세션 초기화.

### Response (예시)

- **GET /chat/health**: `{ "status": "ok", "llm_configured": true }`
- **POST /chat**: `{ "response": "AI 답변 텍스트" }`
- **POST /chat/clear** / **POST /clear**: `{ "message": "기록이 초기화되었습니다." }`

---

## 7. 기타 (Gateway·모니터링)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/actuator/health` 등 | Spring Boot Actuator (헬스체크). Nginx `location /actuator` → Gateway(8085). |

---

## Nginx 노출 경로 요약 (`nginx/sites-available/msa-project`)

| Nginx location | 프록시 대상 (운영) |
|----------------|---------------------|
| `/` | 127.0.0.1:3000 (Next.js) |
| `/user/` | msa-gateway (127.0.0.1:8085) |
| `/auth/` | msa-gateway → auth-service |
| `/api/posts` | msa-gateway → post-service |
| `/api/search` | msa-gateway → search-service |
| `/chat` | msa-gateway → fastapi-ai |
| `/actuator` | msa-gateway |
| `/grafana/` | 127.0.0.1:3001 (Grafana) |

개발 도메인(`dev.minkowskim.com`)은 `/` → 4000, `(auth|user|api|chat)/` 및 `/actuator` → 9085 로 동일하게 Gateway 경유합니다.
