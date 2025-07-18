import asyncio
import json

import ollama


class OllamaService:
    def __init__(self, address="http://localhost:11434", model="deepseek-r1:1.5b"):
        self.address = address
        self._model = model

    async def get_chat_stream(self, user_input):
        try:
            response = ollama.chat(
                model=self._model,
                messages=[{"role": "user", "content": user_input}],
                stream=True,
            )

            for chunk in response:
                # Add a small delay to prevent overwhelming the client
                await asyncio.sleep(0.01)

                # Extract the content from the chunk
                content = chunk.get("message", {}).get("content", "")

                # Only yield if there's actual content
                if content:
                    yield json.dumps({"content": content})

        except Exception as e:
            # Send error message if something goes wrong
            yield json.dumps({"content": f"Error: {str(e)}"})
