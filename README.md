# 🚀 MSA 기반 풀스택 커뮤니티 & AI 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_Lightsail-FF9900?style=for-the-badge&logo=amazonwebservices&logoColor=white)

> **MSA(Microservice Architecture)**를 기반으로 설계된 고효율 시스템입니다.
> 도메인별 최적화된 프레임워크 선택과 보안 강화, 그리고 실시간 AI 챗봇 기능을 제공합니다.

🔗 **라이브 데모**: [https://minkowskim.com/](https://minkowskim.com/)

---

## 🏗️ System Architecture

본 프로젝트는 서비스 간 결합도를 낮추고 확장성을 높이기 위해 마이크로서비스 구조로 설계되었습니다.

- **Frontend**: Next.js (SEO 최적화 및 테마 시스템)
- **User Service**: Spring Boot (인증 및 보안)
- **Post Service**: Spring Boot (게시글 관리)
- **Chatbot Service**: FastAPI (AI 챗봇 엔진)
- **Infrastructure**: AWS Lightsail, Docker, Nginx

---

## 🔥 Key Features

### 1. 보안 강화 유저 시스템 (User Domain)

- **Spring Boot & JWT**: JSON Web Token을 활용한 안전한 인증 체계.
- **HttpOnly Cookie**: 모든 로그인 및 토큰 시스템을 `HttpOnly` 설정으로 구축하여 XSS 공격으로부터 보안을 강화했습니다.

### 2. AI 챗봇 서비스 (Chatbot Domain)

- **FastAPI**: 빠르고 효율적인 비동기 처리 기반 AI 서버.
- **Redis 연동**: Redis를 활용하여 사용자의 이전 대화 기록을 저장하고 맥락이 끊기지 않는 이어가기 기능을 제공합니다.

### 3. 고성능 프론트엔드 (Frontend)

- **Next.js**: SSR/SSG를 통한 **SEO(검색 엔진 최적화)** 구현.
- **다크 모드 & 화이트 모드**: 전 페이지 테마 전환 시스템 도입으로 UX 최적화.
- **Responsive UI**: 모든 기기에 대응하는 반응형 디자인.

### 4. 배포 및 인프라 (DevOps)

- **Containerization**: Docker 및 Docker Compose를 활용하여 서비스 독립성 및 배포 편의성 확보.
- **Nginx**: 리버스 프록시 및 로드 밸런싱 역할 수행.
- **AWS Lightsail**: 클라우드 인프라를 통한 실제 운영 환경 배포.

---

## 🛠 Tech Stack

| 구분                    | 기술 스택                                            |
| :---------------------- | :--------------------------------------------------- |
| **Frontend**            | `Next.js`, `Tailwind CSS`, `Lucide React`            |
| **Backend (Auth/Post)** | `Java`, `Spring Boot`, `Spring Security`, `JPA`      |
| **Backend (AI)**        | `Python`, `FastAPI`, `OpenAI API/LangChain`          |
| **Database/Cache**      | `H2/SQLite`, `Redis`                                 |
| **DevOps**              | `Docker`, `Docker Compose`, `Nginx`, `AWS Lightsail` |
