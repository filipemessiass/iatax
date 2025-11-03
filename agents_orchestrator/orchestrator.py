"""Orchestrator Modular."""
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

from agent_registry import AgentRegistry
from agent_router import AgentRouter

api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ ERRO: GOOGLE_API_KEY não encontrada")
    sys.exit(1)

os.environ["GEMINI_API_KEY"] = api_key

app = Flask(__name__)
CORS(app)

print("\n" + "="*70)
print("🚀 ORCHESTRATOR MODULAR")
print("="*70)

registry = AgentRegistry()
router = AgentRouter(registry)

print(f"✅ Registry: {len(registry.get_all_agent_ids())} agente(s)")
print("="*70 + "\n")

def load_agent_tasks(agent_id: str) -> dict:
    tasks_file = BASE_DIR / "agents" / agent_id / "tasks.yaml"
    
    if not tasks_file.exists():
        return {}
    
    try:
        with open(tasks_file, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"⚠️  Erro ao carregar tasks: {e}")
        return {}

def execute_crew_with_agent(agent_id: str, query: str, task_type: str = "padrao") -> dict:
    try:
        agent = registry.get_agent(agent_id)
        if not agent:
            return {"status": "error", "reply": f"Agente '{agent_id}' indisponível"}
        
        agent_tasks = load_agent_tasks(agent_id)
        
        task_map = {
            "padrao": "consulta_padrao",
            "simples": "consulta_simples",
            "rapida": "resposta_rapida"
        }
        
        task_name = task_map.get(task_type, "consulta_padrao")
        task_config = agent_tasks.get(task_name, {})
        
        if not task_config:
            task_description = f'''
CONSULTA TRIBUTÁRIA

Pergunta: {query}

INSTRUÇÕES:
- 3-5 parágrafos fluidos
- Seção "Fundamentação:" ao final
- Mínimo 2 referências legais
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
        
        print(f"🔄 Executando crew: '{agent_id}'...")
        crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
        result = crew.kickoff()
        response_text = str(result).strip()
        print(f"✅ Resposta: {len(response_text)} chars")
        
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
        return {"status": "error", "error": str(e)}

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "service": "TaxHub Orchestrator Modular",
        "version": "2.0.0",
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
        print(f"🎯 Agente: {routing.primary_agent}")
        
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
        active_agents = registry.get_all_agent_ids()
        return jsonify({
            "status": "healthy",
            "agents_loaded": len(active_agents),
            "active_agents": active_agents
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 TAXHUB ORCHESTRATOR MODULAR")
    print("="*70)
    print(f"✅ {len(registry.get_all_agent_ids())} agente(s) ativo(s)")
    print("✅ Servidor: http://localhost:5000")
    print("="*70 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
