import g4f
import sys
import json

def test():
    try:
        response = g4f.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello, respond in Japanese shortly."}],
        )
        print(json.dumps({"status": "ok", "response": response}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}, ensure_ascii=False))

if __name__ == "__main__":
    test()
