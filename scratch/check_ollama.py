import ollama

try:
    res = ollama.list()
    print("=== Ollama Available Models ===")
    if hasattr(res, "models"):
        for m in res.models:
            print("Model:", m.model)
    else:
        print(res)
except Exception as e:
    print("Ollama connection error:", str(e))
