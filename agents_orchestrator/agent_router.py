"""Agent Router."""
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class RoutingResult:
    primary_agent: str
    confidence: float
    reasoning: str

class AgentRouter:
    def __init__(self, registry):
        self.registry = registry
        print("✅ AgentRouter inicializado")
    
    def route(self, query: str, context: dict = None) -> RoutingResult:
        query_lower = query.lower()
        active_agents = self.registry.get_all_agent_ids()
        
        if not active_agents:
            return RoutingResult(
                primary_agent="irpj_csll",
                confidence=0.0,
                reasoning="Nenhum agente ativo"
            )
        
        if len(active_agents) == 1:
            return RoutingResult(
                primary_agent=active_agents[0],
                confidence=1.0,
                reasoning=f"Único agente: {active_agents[0]}"
            )
        
        scores = []
        
        for agent_id in active_agents:
            keywords = self.registry.get_agent_keywords(agent_id)
            score = self._calculate_keyword_score(query_lower, keywords)
            scores.append((agent_id, score))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        
        best_agent, best_score = scores[0]
        
        if best_score < 0.1:
            return RoutingResult(
                primary_agent=active_agents[0],
                confidence=0.5,
                reasoning=f"Fallback para {active_agents[0]}"
            )
        
        return RoutingResult(
            primary_agent=best_agent,
            confidence=min(best_score, 1.0),
            reasoning=f"Match: {best_score:.2f}"
        )
    
    def _calculate_keyword_score(self, query: str, keywords: List[str]) -> float:
        if not keywords:
            return 0.0
        
        matches = 0
        for keyword in keywords:
            if keyword.lower() in query:
                matches += 1
        
        return matches / len(keywords)
