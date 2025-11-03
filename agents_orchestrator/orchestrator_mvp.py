"""
Orchestrator MVP
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from crewai import Crew, Process, Task
from pathlib import Path
import sys, os
from dotenv import load_dotenv
from datetime import datetime
import traceback

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv()

from agent_registry_mvp import AgentRegistry
from agent_router_mvp import AgentRouter

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERRO: GOOGLE_API_KEY não encontrada no .env")
    sys.exit(1)

os.environ["GEMINI_API_KEY"] = api_key

app = Flask(__name__)
CORS(app)

print("\n" + "="*70)
print("🚀 INICIALIZANDO ORCHESTRATOR MVP")
print("="*70)

registry = AgentRegistry()
router = AgentRouter(registry)

print(f"✅ Registry: {len(registry.get_all_agent_ids())} agente(s)")
print(f"✅ Router: Sistema ativo")
print("="*70 + "\n")

def execute_crew_with_agent(agent_id: str, query: str, task_type: str = "padrao") -> dict:
    try:
        agent = registry.get_agent(agent_id)
        if not agent:
            return {"status": "error", "reply": f"Agente '{agent_id}' indisponível"}
        
        task_templates = {
            "padrao": f'''
CONSULTA TRIBUTÁRIA

Pergunta: {query}

INSTRUÇÕES:
- 3-5 parágrafos fluidos
- Seção "Fundamentação:" ao final
- Mínimo 2 referências legais
- Máximo 600 palavras
''',
            "simples": f"Responda em 2-3 parágrafos com Fundamentação:\n\n{query}",
            "rapida": f"Responda em 1-2 parágrafos com Fundamentação:\n\n{query}"
        }
        
        task = Task(
            description=task_templates.get(task_type, task_templates["padrao"]),
            expected_output="Resposta profissional formatada",
            agent=agent
        )
        
        print(f"🔄 Executando crew com '{agent_id}'...")
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
        result = crew.kickoff()
        response_text = str(result).strip()
        print(f"✅ Resposta gerada ({len(response_text)} chars)")
        
        return {
            "status": "success",
            "reply": response_text,
            "agent_used": agent_id,
            "confidence": 0.90,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Erro: {e}")
        traceback.print_exc()
        return {"status": "error", "error": str(e), "reply": f"Erro: {e}"}

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "service": "TaxHub Orchestrator MVP",
        "version": "1.0.0-mvp",
        "agents_count": len(registry.get_all_agent_ids()),
        "agents": registry.get_all_agent_ids()
    })

@app.route("/api/agents", methods=["GET"])
def list_agents():
    return jsonify({
        "total": 1,
        "agents": [{"id": "irpj", "name": "Especialista IRPJ/CSLL"}]
    })

@app.route("/api/route", methods=["POST"])
def route_query():
    try:
        data = request.get_json()
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Campo 'query' obrigatório"}), 400
        result = router.route(query)
        return jsonify({
            "primary_agent": result.primary_agent,
            "confidence": result.confidence,
            "reasoning": result.reasoning
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        query = data.get("prompt", "").strip()
        task_type = data.get("task_type", "padrao")
        
        if not query:
            return jsonify({"error": "Campo 'prompt' obrigatório"}), 400
        
        print(f"\n{'='*70}")
        print(f"📝 Consulta: {query[:50]}...")
        print(f"{'='*70}")
        
        routing = router.route(query)
        print(f"🎯 Roteado: {routing.primary_agent}")
        
        result = execute_crew_with_agent(routing.primary_agent, query, task_type)
        
        if result["status"] == "error":
            return jsonify(result), 500
        
        return jsonify({
            "reply": result["reply"],
            "sessionId": None,
            "timestamp": result["timestamp"],
            "model": f"crewai-{result['agent_used']}",
            "metadata": {
                "agent_used": result["agent_used"],
                "confidence": result["confidence"]
            }
        })
    except Exception as e:
        print(f"❌ Erro: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    try:
        test_agent = registry.get_agent("irpj")
        agent_ok = test_agent is not None
        gemini_ok = bool(os.getenv("GEMINI_API_KEY"))
        all_ok = agent_ok and gemini_ok
        
        return jsonify({
            "status": "healthy" if all_ok else "degraded",
            "components": {
                "registry": "ok" if agent_ok else "error",
                "router": "ok",
                "gemini_api": "ok" if gemini_ok else "not_configured"
            },
            "agents_loaded": len(registry.get_all_agent_ids())
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 TAXHUB ORCHESTRATOR MVP")
    print("="*70)
    print(f"✅ {len(registry.get_all_agent_ids())} agente(s) pronto(s)")
    print("✅ Servidor: http://localhost:5000")
    print("\n📡 Endpoints:")
    print("   GET  /")
    print("   GET  /api/agents")
    print("   POST /api/route")
    print("   POST /api/chat")
    print("   GET  /api/health")
    print("="*70 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
