"""
Agent Registry - Versão MVP
"""
from typing import Dict, Optional
from crewai import Agent, LLM
import os

class AgentRegistry:
    def __init__(self):
        self.agents_cache: Dict[str, Agent] = {}
        print("✅ AgentRegistry MVP inicializado")
    
    def get_agent(self, agent_id: str = "irpj") -> Optional[Agent]:
        if agent_id in self.agents_cache:
            print(f"📦 Agente '{agent_id}' recuperado do cache")
            return self.agents_cache[agent_id]
        
        print(f"🔨 Criando agente '{agent_id}'...")
        agent = self._create_irpj_agent()
        self.agents_cache[agent_id] = agent
        print(f"✅ Agente '{agent_id}' criado")
        return agent
    
    def _create_irpj_agent(self) -> Agent:
        llm = LLM(
            model="gemini/gemini-2.0-flash-exp",
            temperature=0.7,
            max_tokens=2048,
            top_p=0.95
        )
        
        backstory = '''
Você é um consultor tributário sênior especializado em IRPJ e CSLL.

EXPERTISE:
- IRPJ e CSLL (Lucro Real, Presumido, Arbitrado)
- Dedutibilidade de despesas
- Compensação de prejuízos fiscais
- e-Lalur e e-Lacs

ESTRUTURA DE RESPOSTA:
- 3-5 parágrafos fluidos
- Seção "Fundamentação:" ao final
- Mínimo 2 referências legais
- Máximo 600 palavras

LEIS PRINCIPAIS:
- Lei nº 9.249/1995
- Lei nº 9.430/1996
- Decreto nº 9.580/2018 (RIR/2018)

SEMPRE seja preciso e fundamentado.
'''
        
        agent = Agent(
            role="Consultor Tributário Sênior - IRPJ/CSLL",
            goal="Fornecer pareceres tributários profissionais",
            backstory=backstory,
            llm=llm,
            verbose=False,
            allow_delegation=False,
            max_iter=15,
            memory=True
        )
        return agent
    
    def get_all_agent_ids(self):
        return ["irpj"]
    
    def get_agents_by_category(self, category: str):
        if category == "tributos_federais":
            return ["irpj"]
        return []
