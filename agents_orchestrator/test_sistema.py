"""Teste do sistema."""
import requests
import json

print("\n" + "="*70)
print("🧪 TESTE DO SISTEMA MODULAR")
print("="*70 + "\n")

base_url = "http://localhost:5000"

# Teste 1: Health
print("📝 Teste 1: Health Check")
try:
    response = requests.get(f"{base_url}/api/health")
    data = response.json()
    print(f"   Status: {data['status']}")
    print(f"   Agentes: {data['agents_loaded']}")
    print("   ✅ OK\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# Teste 2: Listar agentes
print("📝 Teste 2: Listar agentes")
try:
    response = requests.get(f"{base_url}/api/agents")
    data = response.json()
    print(f"   Total: {data['total']}")
    for agent in data['agents']:
        print(f"   • {agent['id']}: {agent['name']}")
    print("   ✅ OK\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

# Teste 3: Consulta
print("📝 Teste 3: Consulta tributária")
try:
    payload = {
        "prompt": "O que é IRPJ?",
        "task_type": "simples"
    }
    
    response = requests.post(
        f"{base_url}/api/chat",
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    
    data = response.json()
    reply = data.get("reply", "")
    
    print(f"   Resposta: {reply[:200]}...")
    print(f"   Agente: {data.get('metadata', {}).get('agent_used')}")
    print("   ✅ OK\n")
except Exception as e:
    print(f"   ❌ Erro: {e}\n")

print("="*70)
print("✅ TESTES CONCLUÍDOS")
print("="*70)
