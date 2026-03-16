# ThinkOva
> Ask a question. Watch the web teach you.

![ThinkOva](/visualizer/apps/frontend/public/thinkova.png)

> **Image disclaimer:** The banner above was generated using an AI image generation
> tool for presentation purposes only.

---

## What is it?

ThinkOva is a visual learning tool that takes any topic you type, opens a real browser,
navigates the web automatically, and narrates what it's doing — step by step, out loud.

No links. No walls of text. Just watch and listen.

---
## How it works

1. You type a topic and hit search
2. An AI agent (Nova LLM on AWS Bedrock) breaks it into a step-by-step plan
3. Nova Act executes each step in a real headless browser
4. Live screenshots stream to your screen at 10fps
5. ElevenLabs reads the narration out loud for each step
6. The next step only starts after the audio finishes — so you never fall behind

---

## Stack

| What | Why |
|---|---|
| Next.js | Frontend — search bar, live canvas, WebSocket |
| FastAPI + Redis | Backend — sessions, orchestration |
| AWS Bedrock (Nova LLM) | Generates the step plan |
| Nova Act | Drives the browser, streams screenshots |
| ElevenLabs TTS | Narrates each step out loud |

---

## Architecture

![ThinkOva Architecture](/visualizer/apps/frontend/public/architecture%20diagram.png)

---

## Running it locally

### Backend
```bash
cd apps/backend
cp .env.example .env    # add your keys
docker-compose up
```

### Frontend
```bash
cd apps/frontend
npm install
```

Create `apps/frontend/.env.local`:
```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_yourkey
NEXT_PUBLIC_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

**Backend** (`apps/backend/.env`)
```env
NOVA_ACT_API_KEY=
AGENT_RUNTIME_ARN=
AWS_REGION=
REDIS_URL=
LOCAL_DEV=1
```

**Frontend** (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=
NEXT_PUBLIC_VOICE_ID=
NEXT_PUBLIC_WS_URL=
```

> Never commit either of these files. Both are gitignored.

---

## Project structure
```
visualizer/
├── apps/
│   ├── agent/          # Nova LLM agent + prompts
│   ├── backend/        # FastAPI + Redis + Nova runner
│   └── frontend/       # Next.js app + ElevenLabs TTS
```

---

## Built with

[Nova Act](https://nova-act.aws) · [AWS Bedrock](https://aws.amazon.com/bedrock/) · [ElevenLabs](https://elevenlabs.io) · [Next.js](https://nextjs.org) · [FastAPI](https://fastapi.tiangolo.com)
