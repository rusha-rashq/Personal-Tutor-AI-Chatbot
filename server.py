from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ollama_service import OllamaService
from pydantic import BaseModel
from starlette.responses import StreamingResponse


class ChatRequest(BaseModel):
    query: str


version = "v1"
app = FastAPI(version=version, title="REST API with Ollama and Deepseek")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_service = OllamaService()


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        async for chunk in ai_service.get_chat_stream(request.query):
            # Send each chunk as a separate line
            yield f"{chunk}\n"

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
