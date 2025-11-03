"""
Orchestrator Modular - Suporta 60 agentes
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from crewai import Crew, Process, Task
from pathlib import Path
import sys, os, yaml
from dotenv import load_dotenv
from datetime import datetime
import traceback

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv()

# Imports locais
from agent_registry import AgentRegistry
from agent_router import AgentRouter

# Configurar Gemini API
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERRO: GOOGLE_API_KEY não encontrada")
    sys.exit(1)

os.environ["GEMINI_API_KEY"] = api_key

app = Flask(__name__)
CORS(app)

print("\n" + "="*70)
print("🚀 INICIALIZANDO ORCHESTRATOR MODULAR")
print("="*70)

registry = AgentRegistry()
router = AgentRouter(registry)

print(f"✅ Registry: {len(registry.get_all_agent_ids())} agente(s) ativo(s)")
print(f"✅ Router: Sistema ativo")
print("="*70 + "\n")

def load_agent_tasks(agent_id: str) -> dict:
    """Carrega tasks específicas do agente."""
    tasks_file = BASE_DIR / "agents" / agent_id / "tasks.yaml"
    
    if not tasks_file.exists():
        return {}
    
    try:
        with open(tasks_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"⚠️  Erro ao carregar tasks de '{agent_id}': {e}")
        return {}

def execute_crew_with_agent(agent_id: str, query: str, task_type: str = "padrao") -> dict:
    try:
        agent = registry.get_agent(agent_id)
        if not agent:
            return {"status": "error", "reply": f"Agente '{agent_id}' indisponível"}
        
        # Carregar tasks do agente
        agent_tasks = load_agent_tasks(agent_id)
        
        # Mapear task_type para nome da task
        task_map = {
            "padrao": "consulta_padrao",
            "simples": "consulta_simples",
            "rapida": "resposta_rapida",
            "edape": "analise_edape"
        }
        
        task_name = task_map.get(task_type, "consulta_padrao")
        task_config = agent_tasks.get(task_name, {})
        
        # Se não tem task configurada, usar template padrão
        if not task_config:
            task_description = f'''
CONSULTA TRIBUTÁRIA

Pergunta: {query}

INSTRUÇÕES:
- 3-5 parágrafos fluidos
- Seção "Fundamentação:" ao final
- Mínimo 2 referências legais
- Máximo 600 palavras
'''
        else:
            task_description = task_config.get('description', '').format(
                query=query,
                retrieved_context="",
                additional_context=""
            )
        
        task = Task(
            description=task_description,
            expected_output=task_config.get('expected_output', 'Resposta profissional'),
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
        "service": "TaxHub Orchestrator Modular",
        "version": "2.0.0-modular",
        "agents_count": len(registry.get_all_agent_ids()),
        "agents": registry.get_all_agent_ids()
    })

@app.route("/api/agents", methods=["GET"])
def list_agents():
    agents_list = []
    for agent_id in registry.get_all_agent_ids():
        config = registry.get_agent_config(agent_id)
        if config:
            agents_list.append({
                "id": agent_id,
                "name": config.get('agent_name', agent_id),
                "category": config.get('metadata', {}).get('category', 'N/A'),
                "status": config.get('status', 'active')
            })
    
    return jsonify({
        "total": len(agents_list),
        "agents": agents_list
    })

@app.route("/api/route", methods=["POST"])
def route_query():
    try:
        data = request.get_json()
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Campo 'query' obrigatório"}), 400
        
        result = router.route(query)
        suggestions = router.get_routing_suggestions(query)
        
        return jsonify({
            "primary_agent": result.primary_agent,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
            "suggestions": [{"agent": agent, "score": score} for agent, score in suggestions]
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
        print(f"🎯 Roteado: {routing.primary_agent} (confiança: {routing.confidence:.2f})")
        
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
                "confidence": result["confidence"],
                "routing_confidence": routing.confidence,
                "routing_reasoning": routing.reasoning
            }
        })
    except Exception as e:
        print(f"❌ Erro: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    try:
        active_agents = registry.get_all_agent_ids()
        test_agent = registry.get_agent(active_agents[0]) if active_agents else None
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
            "agents_loaded": len(active_agents),
            "active_agents": active_agents
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 TAXHUB ORCHESTRATOR MODULAR")
    print("="*70)
    print(f"✅ {len(registry.get_all_agent_ids())} agente(s) ativo(s):")
    for agent_id in registry.get_all_agent_ids():
        config = registry.get_agent_config(agent_id)
        name = config.get('agent_name', agent_id) if config else agent_id
        print(f"   • {agent_id}: {name}")
    print("✅ Servidor: http://localhost:5000")
    print("\n📡 Endpoints:")
    print("   GET  /")
    print("   GET  /api/agents")
    print("   POST /api/route")
    print("   POST /api/chat")
    print("   GET  /api/health")
    print("="*70 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
