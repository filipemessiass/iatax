"""
Script de Teste MVP
"""
import sys
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test(msg): print(f"\n{Colors.BLUE}🧪 {msg}{Colors.END}")
def success(msg): print(f"{Colors.GREEN}✅ {msg}{Colors.END}")
def error(msg): print(f"{Colors.RED}❌ {msg}{Colors.END}"); sys.exit(1)

print(f"\n{'='*70}\n{'TESTE DO SISTEMA MVP':^70}\n{'='*70}\n")

test("TESTE 1: Imports")
try:
    import crewai; success("crewai")
except: error("crewai não instalado")

try:
    import flask; success("flask")
except: error("flask não instalado")

try:
    from dotenv import load_dotenv; success("python-dotenv")
except: error("python-dotenv não instalado")

try:
    import google.generativeai; success("google-generativeai")
except: error("google-generativeai não instalado")

test("TESTE 2: Arquivos")
for f in ["agent_registry_mvp.py", "agent_router_mvp.py", "orchestrator_mvp.py", ".env"]:
    if Path(f).exists(): success(f)
    else: error(f"{f} não encontrado")

test("TESTE 3: .env")
load_dotenv()
import os
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if api_key: success(f"API Key OK ({api_key[:10]}...)")
else: error("API Key não configurada")

test("TESTE 4: AgentRegistry")
try:
    from agent_registry_mvp import AgentRegistry
    registry = AgentRegistry()
    success("AgentRegistry OK")
    agent = registry.get_agent("irpj")
    if agent: success(f"Agente IRPJ: {agent.role}")
    else: error("Falha ao criar agente")
    agent2 = registry.get_agent("irpj")
    if agent is agent2: success("Cache OK")
except Exception as e:
    error(f"Erro: {e}")

test("TESTE 5: AgentRouter")
try:
    from agent_router_mvp import AgentRouter
    router = AgentRouter(registry)
    success("AgentRouter OK")
    result = router.route("Teste")
    if result.primary_agent == "irpj": success("Roteamento OK")
    else: error("Roteamento falhou")
except Exception as e:
    error(f"Erro: {e}")

test("TESTE 6: Gemini AI")
try:
    from crewai import Crew, Process, Task
    os.environ["GEMINI_API_KEY"] = api_key
    task = Task(
        description="Responda em UMA frase: O que é IRPJ?",
        expected_output="Resposta curta",
        agent=agent
    )
    print("   Consultando Gemini...")
    crew = Crew(agents=[agent], tasks=[task], process=Process.sequential, verbose=False)
    result = crew.kickoff()
    resp = str(result).strip()
    if resp and len(resp) > 10:
        success("Gemini OK")
        print(f"   Resposta: {resp[:100]}...")
    else: error("Resposta vazia")
except Exception as e:
    error(f"Erro: {e}")

print(f"\n{'='*70}\n{Colors.GREEN}✅ TODOS OS TESTES PASSARAM!{Colors.END}\n{'='*70}\n")
print(f"{Colors.GREEN}Sistema pronto!{Colors.END}")
print(f"\n{Colors.BLUE}Iniciar servidor:{Colors.END}\npython orchestrator_mvp.py\n")
