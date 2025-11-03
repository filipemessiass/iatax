"""Agent Registry Modular."""
from pathlib import Path
from typing import Dict, Optional, List
import yaml
from crewai import Agent, LLM
import os

class AgentRegistry:
    def __init__(self, config_path: str = "config/agents_control.yaml"):
        self.base_dir = Path(__file__).parent
        self.config_path = self.base_dir / config_path
        self.agents_dir = self.base_dir / "agents"
        
        self.agents_cache: Dict[str, Agent] = {}
        self.agents_config: Dict[str, dict] = {}
        self.active_agents: List[str] = []
        
        self._load_global_config()
        self._load_agents_config()
        
        print(f"✅ AgentRegistry: {len(self.active_agents)} agente(s) ativo(s)")
    
    def _load_global_config(self):
        if not self.config_path.exists():
            print(f"⚠️  Config não encontrado: {self.config_path}")
            self.active_agents = ["irpj_csll"]
            return
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            self.active_agents = config.get('active_agents', [])
            self.global_config = config.get('global_config', {})
            
        except Exception as e:
            print(f"❌ Erro ao carregar config: {e}")
            self.active_agents = ["irpj_csll"]
    
    def _load_agents_config(self):
        for agent_id in self.active_agents:
            agent_dir = self.agents_dir / agent_id
            config_file = agent_dir / "config.yaml"
            
            if not config_file.exists():
                print(f"⚠️  Config não encontrado: {agent_id}")
                continue
            
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                
                self.agents_config[agent_id] = config
                print(f"  ✅ {agent_id}: {config.get('agent_name', 'N/A')}")
                
            except Exception as e:
                print(f"  ❌ Erro em {agent_id}: {e}")
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        if agent_id not in self.active_agents:
            print(f"⚠️  Agente '{agent_id}' não está ativo")
            return None
        
        if agent_id in self.agents_cache:
            return self.agents_cache[agent_id]
        
        agent = self._create_agent(agent_id)
        
        if agent:
            self.agents_cache[agent_id] = agent
        
        return agent
    
    def _create_agent(self, agent_id: str) -> Optional[Agent]:
        config = self.agents_config.get(agent_id)
        if not config:
            return None
        
        try:
            llm_config = config.get('llm_config', {})
            agent_config = config.get('agent_config', {})
            
            llm = LLM(
                model=llm_config.get('model', 'gemini/gemini-2.0-flash-exp'),
                temperature=llm_config.get('temperature', 0.7),
                max_tokens=llm_config.get('max_tokens', 1200),
                top_p=llm_config.get('top_p', 0.8)
            )
            
            agent = Agent(
                role=agent_config.get('role', 'Consultor'),
                goal=agent_config.get('goal', 'Fornecer consultoria'),
                backstory=agent_config.get('backstory', ''),
                llm=llm,
                verbose=agent_config.get('verbose', False),
                allow_delegation=agent_config.get('allow_delegation', False),
                max_iter=agent_config.get('max_iter', 15),
                memory=agent_config.get('memory', True)
            )
            
            return agent
            
        except Exception as e:
            print(f"❌ Erro ao criar {agent_id}: {e}")
            return None
    
    def get_all_agent_ids(self) -> List[str]:
        return self.active_agents
    
    def get_agent_config(self, agent_id: str) -> Optional[dict]:
        return self.agents_config.get(agent_id)
    
    def get_agent_keywords(self, agent_id: str) -> List[str]:
        config = self.agents_config.get(agent_id, {})
        routing = config.get('routing_keywords', {})
        
        primary = routing.get('primary', [])
        secondary = routing.get('secondary', [])
        
        return primary + secondary
