/**
 * ============================================
 * AGENTE HIST�"RICO - SCRIPT PRINCIPAL
 * Gerenciamento completo da página de histórico
 * (Versão Padronizada e Autónoma)
 *
 * Comentários Educativos:
 * Este ficheiro é o "cérebro" da página de histórico.
 * Ele foi segregado do HTML e padronizado.
 * ============================================
 */

(() => {
  /**
   * SE�?�fO 1: CONFIGURA�?�fO DO AGENTE (PADR�fO)
   * Define as constantes para o fechamento da janela.
   */
  const CONFIG = {
    agentId: 'historico',
    agentName: 'Histórico de Conversas',
  };

  let chatFechado = false;

  /**
   * SE�?�fO 2: FUN�?�.ES DE FECHAMENTO (PADR�fO)
   * Funções importadas do padrão de agente para
   * permitir que o botão "X" volte ao menu principal.
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }
    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    // Tenta chamar a função global de restauração (se existir)
    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        console.warn('Não foi possível restaurar o conteúdo inicial:', erro);
      }
    }
    
    // Dispara eventos customizados que o menu pode estar a "ouvir"
    document.dispatchEvent(new CustomEvent('chatClosed', { detail: detalhe }));
    document.dispatchEvent(new CustomEvent('chat:closed', { detail: detalhe }));

    // Envia uma mensagem para o 'window.parent' (se estiver num iframe)
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          { type: 'chat-closed', ...detalhe },
          '*'
        );
      } catch (erroPostMessage) {
        console.warn('Não foi possível enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  function configurarBotaoFechar() {
    // O seletor [data-close-chat] é o padrão dos agentes
    const closeButton = document.querySelector('[data-close-chat]');
    const chatContainer = document.getElementById('chat-container');

    if (closeButton && chatContainer) {
      closeButton.addEventListener('click', (evento) => {
        evento.preventDefault();
        evento.stopImmediatePropagation(); // Impede o clique de "borbulhar"

        // Esconde o chat e notifica o menu
        chatContainer.style.display = 'none';
        chatContainer.classList.add('chat-closed');

        notificarFechamento();
      });
    } else {
      console.warn('Botão de fechar ou container do chat não encontrado.');
    }
  }

  /**
   * SE�?�fO 3: L�"GICA DA PÁGINA DE HIST�"RICO
   * (Lógica original do seu ficheiro historico.html)
   */

  // Estrutura de dados para armazenar conversas
  const STORAGE_KEY = 'taxhub_conversas_historico';

  // Função para salvar conversa (será chamada pelos agentes)
  function salvarConversa(agentId, agentName, mensagens) {
    const conversas = obterConversas();
    const novaConversa = {
      id: Date.now(),
      agentId: agentId,
      agentName: agentName,
      data: new Date().toISOString(),
      mensagens: mensagens,
      preview: mensagens[0]?.conteudo?.substring(0, 150) || 'Sem prévia disponível'
    };
    conversas.unshift(novaConversa);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversas));
    return novaConversa.id;
  }

  // Função para obter todas as conversas
  function obterConversas() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Função para obter uma conversa específica
  function obterConversa(id) {
    const conversas = obterConversas();
    return conversas.find(c => c.id === id);
  }

  // Função para deletar conversa
  function deletarConversa(id) {
    const conversas = obterConversas();
    const novasConversas = conversas.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novasConversas));
    carregarConversas();
  }

  // Função para limpar todo o histórico
  function limparHistorico() {
    localStorage.removeItem(STORAGE_KEY);
    carregarConversas();
  }

  // Função para confirmar limpeza
  function confirmarLimparHistorico() {
    if (confirm('�s�️ Tem certeza que deseja limpar TODO o histórico de conversas?\n\nEsta ação não pode ser desfeita!')) {
      limparHistorico();
      alert('�o. Histórico limpo com sucesso!');
    }
  }

  // Função para formatar data
  function formatarData(isoString) {
    const data = new Date(isoString);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const diaData = data.toDateString();
    const diaHoje = hoje.toDateString();
    const diaOntem = ontem.toDateString();

    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (diaData === diaHoje) {
      return `Hoje às ${hora}`;
    } else if (diaData === diaOntem) {
      return `Ontem às ${hora}`;
    } else {
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ` às ${hora}`;
    }
  }

  // Função para calcular estatísticas
  function calcularEstatisticas() {
    const conversas = obterConversas();
    const agentes = new Set(conversas.map(c => c.agentId));
    
    document.getElementById('totalConversas').textContent = conversas.length;
    document.getElementById('agentesUtilizados').textContent = agentes.size;
    
    if (conversas.length > 0) {
      const ultimaData = new Date(conversas[0].data);
      const hoje = new Date();
      const diffDias = Math.floor((hoje - ultimaData) / (1000 * 60 * 60 * 24));
      
      if (diffDias === 0) {
        document.getElementById('ultimaConversa').textContent = 'Hoje';
      } else if (diffDias === 1) {
        document.getElementById('ultimaConversa').textContent = 'Ontem';
      } else {
        document.getElementById('ultimaConversa').textContent = `${diffDias}d atrás`;
      }
    } else {
      document.getElementById('ultimaConversa').textContent = '-';
    }
  }

  // Função para popular filtro de agentes
  function popularFiltroAgentes() {
    const conversas = obterConversas();
    const agentes = [...new Set(conversas.map(c => ({ id: c.agentId, name: c.agentName })))]
      .reduce((acc, curr) => {
        if (!acc.find(a => a.id === curr.id)) acc.push(curr);
        return acc;
      }, []);
    
    const select = document.getElementById('filterAgent');
    select.innerHTML = '<option value="">Todos os Agentes</option>';
    
    agentes.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabeticamente
    
    agentes.forEach(agente => {
      const option = document.createElement('option');
      option.value = agente.id;
      option.textContent = agente.name;
      select.appendChild(option);
    });
  }

  // Função para filtrar conversas
  function filtrarConversas() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const agentFilter = document.getElementById('filterAgent').value;
    const periodFilter = document.getElementById('filterPeriod').value;
    
    let conversas = obterConversas();
    
    // Filtro de busca
    if (searchTerm) {
      conversas = conversas.filter(c => 
        c.agentName.toLowerCase().includes(searchTerm) ||
        c.preview.toLowerCase().includes(searchTerm) ||
        c.mensagens.some(m => m.conteudo.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filtro de agente
    if (agentFilter) {
      conversas = conversas.filter(c => c.agentId === agentFilter);
    }
    
    // Filtro de período
    if (periodFilter) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      conversas = conversas.filter(c => {
        const dataConversa = new Date(c.data);
        dataConversa.setHours(0, 0, 0, 0); // Normalizar data da conversa
        
        // Calcular diferença em dias
        const diffTime = Math.abs(hoje.getTime() - dataConversa.getTime());
        const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch(periodFilter) {
          case 'today':
            return dataConversa.getTime() === hoje.getTime();
          case 'week':
            return diffDias < 7; // Dias 0-6
          case 'month':
            return diffDias < 30; // Dias 0-29
          case 'year':
            return diffDias < 365; // Dias 0-364
          default:
            return true;
        }
      });
    }
    
    renderizarConversas(conversas);
  }

  // Função para renderizar conversas
  function renderizarConversas(conversas = null) {
    const lista = document.getElementById('conversasList');
    
    if (!conversas) {
      conversas = obterConversas();
    }
    
    if (conversas.length === 0) {
      lista.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">
            <i class="fas fa-inbox"></i>
          </div>
          <h2 class="empty-state__title">Nenhuma conversa encontrada</h2>
          <p class="empty-state__text">
            Suas conversas com os agentes TaxHub IA aparecerão aqui. 
            Comece uma nova conversa para ver o histórico.
          </p>
        </div>
      `;
      return;
    }
    
    lista.innerHTML = conversas.map(conversa => `
      <div class="conversa-card" onclick="visualizarConversa(${conversa.id})">
        <div class="conversa-card__header">
          <div class="conversa-card__info">
            <div class="conversa-card__title">
              <span>${conversa.agentName}</span>
              <span class="conversa-card__agent">
                <i class="fas fa-robot"></i>
                ${conversa.agentId}
              </span>
            </div>
            <div class="conversa-card__meta">
              <span>
                <i class="fas fa-calendar"></i>
                ${formatarData(conversa.data)}
              </span>
              <span>
                <i class="fas fa-comments"></i>
                ${conversa.mensagens.length} mensagens
              </span>
            </div>
          </div>
        </div>
        <div class="conversa-card__preview">
          ${conversa.preview}...
        </div>
        <div class="conversa-card__actions">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); visualizarConversa(${conversa.id})">
            <i class="fas fa-eye"></i>
            Visualizar
          </button>
          <button class="btn btn-sm btn-outline" onclick="event.stopPropagation(); recuperarConversa(${conversa.id})">
            <i class="fas fa-redo"></i>
            Recuperar
          </button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); confirmarDeletar(${conversa.id})">
            <i class="fas fa-trash"></i>
            Excluir
          </button>
        </div>
      </div>
    `).join('');
  }

  // Função para visualizar conversa
  function visualizarConversa(id) {
    const conversa = obterConversa(id);
    if (!conversa) return;
    
    document.getElementById('modalTitle').textContent = `${conversa.agentName} - ${formatarData(conversa.data)}`;
    
    const mensagensHTML = conversa.mensagens.map(msg => `
      <div class="chat-message-item ${msg.tipo}">
        <div class="chat-message-item__header">
          <i class="fas fa-${msg.tipo === 'user' ? 'user' : 'robot'}"></i>
          <span>${msg.tipo === 'user' ? 'Você' : conversa.agentName}</span>
          <span style="margin-left: auto; opacity: 0.7;">${new Date(msg.timestamp || conversa.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="chat-message-item__content">
          ${msg.conteudo}
        </div>
      </div>
    `).join('');
    
    document.getElementById('modalBody').innerHTML = mensagensHTML;
    document.getElementById('viewModal').classList.add('active');
  }

  // Função para fechar modal
  function fecharModal() {
    document.getElementById('viewModal').classList.remove('active');
  }

  // Função para recuperar conversa
  function recuperarConversa(id) {
    const conversa = obterConversa(id);
    if (!conversa) return;
    
    // Salvar conversa no sessionStorage para ser recuperada pelo agente
    sessionStorage.setItem('recuperar_conversa', JSON.stringify({
      agentId: conversa.agentId,
      mensagens: conversa.mensagens
    }));
    
    // Redirecionar para o menu principal
    window.parent.postMessage({
      type: 'recuperar-conversa',
      agentId: conversa.agentId,
      mensagens: conversa.mensagens
    }, '*');
    
    alert(`�o. Conversa recuperada!\n\nVocê será redirecionado para o agente "${conversa.agentName}" com o histórico da conversa.`);
  }

  // Função para confirmar deleção
  function confirmarDeletar(id) {
    if (confirm('�s�️ Tem certeza que deseja excluir esta conversa?\n\nEsta ação não pode ser desfeita!')) {
      deletarConversa(id);
      alert('�o. Conversa excluída com sucesso!');
    }
  }
  
  // COMENTÁRIO EDUCATIVO: A função 'exportarHistorico' foi removida conforme solicitado.

  // Função para carregar conversas
  function carregarConversas() {
    renderizarConversas();
    calcularEstatisticas();
    popularFiltroAgentes();
  }

  // Função para gerar dados de exemplo (apenas para demonstração)
  function gerarDadosExemplo() {
    if (obterConversas().length > 0) return; // Não gera se já houver dados

    const exemplos = [
      {
        agentId: 'irpj',
        agentName: 'Agente Tax - Consultor IRPJ e CSLL',
        mensagens: [
          {
            tipo: 'user',
            conteudo: 'Como funciona o cálculo do IRPJ pelo lucro real?',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            tipo: 'bot',
            conteudo: 'O IRPJ pelo lucro real é calculado sobre o lucro líquido do período, ajustado pelas adições, exclusões e compensações previstas na legislação. A alíquota é de 15% sobre o lucro real, mais adicional de 10% sobre a parcela que exceder R$ 20.000,00 por mês.',
            timestamp: new Date(Date.now() - 86390000).toISOString()
          }
        ]
      },
      {
        agentId: 'fgts',
        agentName: 'Agente Tax - Consultor FGTS',
        mensagens: [
          {
            tipo: 'user',
            conteudo: 'O que é o FGTS Digital?',
            timestamp: new Date(Date.now() - 172800000).toISOString()
          },
          {
            tipo: 'bot',
            conteudo: 'O **FGTS Digital** é a nova forma de gestão e arrecadação dos valores devidos ao Fundo de Garantia do Tempo de Serviço. Ele utiliza o eSocial como base de dados e permite o recolhimento via PIX.',
            timestamp: new Date(Date.now() - 172790000).toISOString()
          }
        ]
      }
    ];

    exemplos.forEach(exemplo => {
      salvarConversa(exemplo.agentId, exemplo.agentName, exemplo.mensagens);
    });
    
    carregarConversas();
  }

  /**
   * SE�?�fO 4: INICIALIZA�?�fO
   * Dispara a função 'iniciarChat' quando o DOM estiver pronto.
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      configurarBotaoFechar(); // Configura o botão "X"
      carregarConversas();
      
      // Gerar dados de exemplo se não houver conversas
      if (obterConversas().length === 0) {
        gerarDadosExemplo();
      }
      
      // Fechar modal ao clicar fora
      document.getElementById('viewModal').addEventListener('click', function(e) {
        if (e.target === this) {
          fecharModal();
        }
      });

      // Fechar modal com ESC
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          fecharModal();
        }
      });
      
      // Disponibilizar funções globalmente para os botões inline
      window.filtrarConversas = filtrarConversas;
      window.confirmarLimparHistorico = confirmarLimparHistorico;
      window.visualizarConversa = visualizarConversa;
      window.fecharModal = fecharModal;
      window.recuperarConversa = recuperarConversa;
      window.confirmarDeletar = confirmarDeletar;
      window.salvarConversa = salvarConversa; // Expor para outros agentes
      window.obterConversas = obterConversas;
      window.obterConversa = obterConversa;
      
    }, { once: true });
  } else {
    // Fallback se o DOM já estiver carregado
    configurarBotaoFechar();
    carregarConversas();
    if (obterConversas().length === 0) {
      gerarDadosExemplo();
    }
    
    // Disponibilizar funções globalmente para os botões inline
    window.filtrarConversas = filtrarConversas;
    window.confirmarLimparHistorico = confirmarLimparHistorico;
    window.visualizarConversa = visualizarConversa;
    window.fecharModal = fecharModal;
    window.recuperarConversa = recuperarConversa;
    window.confirmarDeletar = confirmarDeletar;
    window.salvarConversa = salvarConversa;
    window.obterConversas = obterConversas;
    window.obterConversa = obterConversa;
  }
})();