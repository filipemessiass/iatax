/**
 * ============================================
 * AGENT TAX CONSULT TP - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * ============================================
 *
 * COMENTÁRIO EDUCATIVO:
 * Este ficheiro JS é "autónomo". Ele contém toda a lógica necessária
 * para o chat de TP funcionar, incluindo a criação de mensagens,
 * envio (simulado) e resposta (simulada).
 */

(() => {
  // Configuração do Agente
  const CONFIG = {
    agentId: 'tp',
    agentName: 'Agente Tax Consultor Transfer Pricing',
    apiContext: 'TRANSFER_PRICING',
    // AJUSTE DE TEXTO: Corrigido "atendimento"
    closingMessage: 'Conversa encerrada. Para reiniciar um atendimento sobre Transfer Pricing, selecione novamente o agente.'
  };
  let chatFechado = false;
  
  // NOTA: A variável 'enviandoMensagem' não estava a ser usada no seu ficheiro original.
  // Se a sua função 'enviarMensagem' for fazer uma chamada de API real,
  // descomente 'let enviandoMensagem = false;' e use-a para bloquear múltiplos envios.

  /**
   * Notifica o fechamento do chat para a aplicação principal (menu-tax-hub-ia.js)
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }

    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    // Tenta chamar a função global do menu para restaurar o ecrã de boas-vindas
    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        // AJUSTE DE TEXTO: Corrigido "Nao", "possivel", "conteudo"
        console.warn('Não foi possível restaurar o conteúdo inicial:', erro);
      }
    }

    // Dispara eventos para que o menu possa "ouvir" que o chat fechou
    document.dispatchEvent(new CustomEvent('chatClosed', { detail: detalhe }));
    document.dispatchEvent(new CustomEvent('chat:closed', { detail: detalhe }));

    // Envia uma mensagem para o "pai" (a janela principal), se existir
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage(
          {
            type: 'chat-closed',
            ...detalhe
          },
          '*'
        );
      } catch (erroPostMessage) {
        // AJUSTE DE TEXTO: Corrigido "Nao", "possivel", "fechamento"
        console.warn('Não foi possível enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  /**
   * Função de inicialização do chat
   */
  function iniciarChat() {
    // Configura o botão de fechar PRIMEIRO
    configurarBotaoFechar();
    
    // Verifica se a função global de inicialização existe
    if (typeof initializeAgentChat !== 'function') {
      // AJUSTE DE TEXTO: Corrigido "nao", "disponivel"
      console.error('initializeAgentChat não está disponível para o agente Transfer Pricing.');
      return;
    }

    try {
      // NOTA: O seu JS original chamava 'initializeAgentChat',
      // mas também tinha a sua própria lógica de 'adicionarMensagem', 'enviarMensagem', etc.
      // Vou manter a sua lógica original (autónoma) pois ela já funciona.
      
      // Adiciona listeners adicionais específicos do agente
      adicionarListenersCustomizados();
      
      // Configura auto-resize do textarea
      configurarAutoResize();
      
      // Configura atalhos de teclado
      configurarAtalhosTeclado();
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (error) {
      console.error('Erro ao inicializar o agente Transfer Pricing:', error);
    }
  }

  /**
   * Configura o botão de fechar o chat
   */
  function configurarBotaoFechar() {
    const closeButton = document.querySelector('[data-close-chat]');
    const chatContainer = document.getElementById('chat-container');
    
    if (closeButton && chatContainer) {
      closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        console.log('Fechando chat Transfer Pricing...');
        
        // Esconde o chat
        chatContainer.style.display = 'none';
        
        // Adiciona classe de fechado
        chatContainer.classList.add('chat-closed');

        notificarFechamento();
      });
      
      // AJUSTE DE TEXTO: Corrigido "Botao"
      console.log('Botão de fechar configurado com sucesso');
    } else {
      // AJUSTE DE TEXTO: Corrigido "Botao", "nao"
      console.warn('Botão de fechar ou container não encontrado');
    }
  }

  /**
   * Adiciona listeners customizados para melhorar a experiência
   */
  function adicionarListenersCustomizados() {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');
    
    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      // AJUSTE DE TEXTO: Corrigido "nao"
      console.warn('Elementos do chat não encontrados para adicionar listeners.');
      return;
    }

    // Previne refresh da página no submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!chatFechado) {
        enviarMensagem();
      }
    });

    // Placeholder dinâmico
    let placeholderIndex = 0;
    // AJUSTE DE TEXTO: Corrigido acentuação e "é"
    const placeholders = [
      'Escreva sua pergunta sobre Transfer Pricing...',
      'Qual método de TP usar?',
      'Como documentar operações com partes relacionadas?',
      'O que é análise de comparabilidade?',
      'Quais são as obrigações acessórias de TP?'
    ];

    // Alterna placeholder a cada 5 segundos quando input está vazio
    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = placeholders[placeholderIndex] + ' (Shift+Enter para nova linha)';
      }
    }, 5000);

    // Visual feedback no botão de enviar
    messageInput.addEventListener('input', () => {
      const hasText = messageInput.value.trim().length > 0;
      sendButton.style.transform = hasText ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = hasText 
        ? '0 12px 32px rgba(0, 0, 0, 0.5)' 
        : '0 8px 24px rgba(0, 0, 0, 0.35)';
    });

    // Scroll suave para última mensagem
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: 'smooth'
      });
    });

    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * Configura auto-resize do textarea baseado no conteúdo
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    
    if (!messageInput) return;

    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      const newHeight = Math.min(this.scrollHeight, 140);
      this.style.height = newHeight + 'px';
      
      // Ajusta a altura mínima responsivamente
      const minHeight = window.innerWidth < 480 ? 48 : (window.innerWidth < 768 ? 50 : 56);
      if (newHeight < minHeight) {
        this.style.height = minHeight + 'px';
      }
    });

    // Reset altura ao limpar
    messageInput.addEventListener('blur', function() {
      if (this.value.trim() === '') {
        this.style.height = 'auto';
      }
    });
  }

  /**
   * Configura atalhos de teclado
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (e) => {
      // Enter sem Shift envia mensagem
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
      
      // Ctrl/Cmd + K limpa o chat
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        // AJUSTE DE TEXTO: Corrigido "historico"
        if (confirm('Deseja limpar o histórico de conversa?')) {
          limparChat();
        }
      }
    });
  }

  /**
   * Envia mensagem do usuário
   */
  function enviarMensagem() {
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');
    const sendButton = document.getElementById('send-button');
    
    if (!messageInput || !chatWindow || !sendButton) return;

    const mensagem = messageInput.value.trim();
    
    if (mensagem === '') {
      // Feedback visual de campo vazio
      messageInput.style.borderColor = '#7AC143';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }
    
    // Desativa input
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Adiciona mensagem do usuário
    adicionarMensagem('user', mensagem);
    
    // Limpa input e reseta altura
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    // Mostra indicador de digitação
    mostrarIndicadorDigitacao();

    // Simula resposta do bot (aqui você integraria com sua API)
    setTimeout(() => {
      removerIndicadorDigitacao();
      const resposta = gerarRespostaBot(mensagem);
      adicionarMensagem('bot', resposta);
      
      // Reativa input
      if (!chatFechado) {
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
      }
    }, 1500 + Math.random() * 1000);
  }

  /**
   * Adiciona mensagem ao chat
   */
  function adicionarMensagem(tipo, conteudo) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `chat-message ${tipo}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const avatarIcon = document.createElement('i');
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-globe' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // Se marked.js está disponível, renderiza markdown
    if (typeof marked !== 'undefined') {
      bubbleDiv.innerHTML = marked.parse(conteudo);
    } else {
      bubbleDiv.textContent = conteudo;
    }
    
    contentDiv.appendChild(bubbleDiv);
    mensagemDiv.appendChild(avatarDiv);
    mensagemDiv.appendChild(contentDiv);
    
    chatWindow.appendChild(mensagemDiv);
  }

  /**
   * Mostra indicador de digitação
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    // Remove indicador anterior, se houver
    removerIndicadorDigitacao();

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-globe';
    avatarDiv.appendChild(avatarIcon);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    bubbleDiv.appendChild(typingDiv);
    contentDiv.appendChild(bubbleDiv);
    loadingDiv.appendChild(avatarDiv);
    loadingDiv.appendChild(contentDiv);
    
    chatWindow.appendChild(loadingDiv);
  }

  /**
   * Remove indicador de digitação
   */
  function removerIndicadorDigitacao() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Gera resposta do bot (simulação - substituir por chamada real à API)
   *
   * AJUSTE DE TEXTO: Todo este bloco foi corrigido para UTF-8.
   */
  function gerarRespostaBot(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    // Respostas contextuais baseadas em palavras-chave
    if (mensagemLower.includes('pic') || mensagemLower.includes('preço independente comparado')) {
      return `O **Método PIC (Preço Independente Comparado)** é um dos métodos mais diretos de Transfer Pricing.

**Características:**
- Compara preço praticado com partes relacionadas com preço de mercado
- Preferencialmente usado quando há comparáveis diretos disponíveis
- Aplicável tanto para importação quanto exportação
- Requer análise de comparabilidade rigorosa

**Vantagens:**
- Mais próximo da realidade de mercado
- Maior aceitação pelas autoridades fiscais

**Desafios:**
- Dificuldade em encontrar comparáveis perfeitos
- Necessidade de ajustes de comparabilidade

Posso ajudá-lo com algum aspecto específico do PIC?`;
    }
    
    if (mensagemLower.includes('prl') || mensagemLower.includes('preço de revenda')) {
      return `O **Método PRL (Preço de Revenda menos Lucro)** é utilizado principalmente para operações de importação de bens.

**Como funciona:**
- Parte do preço de revenda no mercado brasileiro
- Deduz margem de lucro adequada
- Resulta no preço de transferência aceitável

**Aplicação:**
- Ideal para distribuidores/revendedores
- Requer análise de margens brutas de comparáveis
- Margem fixa de 20% para importações quando não há comparáveis (safe harbor)

**Cálculo básico:**
Preço TP = Preço Revenda × (1 - Margem Lucro Bruta)

Tem dúvidas sobre a aplicação do PRL?`;
    }
    
    if (mensagemLower.includes('cpl') || mensagemLower.includes('custo de produção')) {
      return `O **Método CPL (Custo de Produção mais Lucro)** é usado principalmente para exportações.

**Características:**
- Baseia-se nos custos de produção
- Adiciona margem de lucro adequada
- Aplicável quando há dificuldade em obter comparáveis externos

**Fórmula:**
Preço TP = Custo Produção × (1 + Margem Lucro)

**Margem de lucro:**
- Determinada por análise de comparáveis
- Safe harbor: margem fixa de 15% para exportações

**Quando usar:**
- Manufatura de produtos específicos
- Prestação de serviços especializados
- Quando o vendedor não agrega valor significativo

Precisa de mais informações sobre CPL?`;
    }
    
    if (mensagemLower.includes('documentação') || mensagemLower.includes('compliance')) {
      return `A **documentação de Transfer Pricing** é essencial para compliance fiscal no Brasil.

**Obrigações principais:**

1. **Master File (Arquivo Mestre)**
   - Visão global do grupo empresarial
   - Prazo: até o último dia útil de setembro

2. **Local File (Arquivo Local)**
   - Operações específicas da empresa brasileira
   - Prazo: até o último dia útil de setembro

3. **Country-by-Country Report (CbCR)**
   - Para grupos com receita consolidada > R$ 2,26 bilhões
   - Prazo: até 31 de julho

4. **Declaração de Operações com Partes Relacionadas**
   - Detalhamento das transações
   - Entregue junto com a ECF

**Penalidades por não conformidade:**
- Multas de até R$ 100.000
- Autuações fiscais

Posso ajudá-lo com algum documento específico?`;
    }
    
    if (mensagemLower.includes('in 2132') || mensagemLower.includes('in 2.132') || mensagemLower.includes('legislação')) {
      return `A **IN RFB 2.132/2023** atualizou as regras de Transfer Pricing no Brasil, alinhando-as às diretrizes OCDE.

**Principais mudanças:**

✓ **Novos métodos:**
- Método da Margem Líquida da Transação (MMLT)
- Método da Divisão de Lucros (MDL)

✓ **Análise de comparabilidade:**
- Critérios mais rigorosos
- Necessidade de ajustes detalhados

✓ **Documentação:**
- Master File, Local File e CbCR obrigatórios
- Estrutura alinhada à OCDE

✓ **Safe harbors:**
- Mantidos para operações específicas
- Margens de 20% (PRL) e 15% (CPL)

✓ **Vigência:**
- A partir do ano-calendário 2024

**Impactos:**
- Maior complexidade na análise
- Necessidade de estudos econômicos robustos
- Alinhamento com práticas internacionais

Tem dúvidas sobre alguma mudança específica?`;
    }
    
    // Resposta genérica (AJUSTE DE TEXTO E EMOJIS)
    return `Obrigado pela sua pergunta sobre **Transfer Pricing**! Como especialista em Preços de Transferência, posso ajudá-lo com:

- 📊 **Métodos de precificação** (PIC, PRL, CPL, PSL, PECEX, MMLT, MDL)
- 🧾 **Documentação obrigatória** (Master File, Local File, CbCR)
- 🔎 **Análise de comparabilidade**
- ⚖️ **Compliance fiscal**
- 🌍 **Operações internacionais**
- 📖 **IN RFB 2.132/2023**

Pode me fazer uma pergunta mais específica? Estou aqui para ajudar com seus desafios em Transfer Pricing!`;
  }

  /**
   * Limpa o chat mantendo apenas a mensagem inicial
   */
  function limparChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    // Remove todas as mensagens exceto a primeira
    const mensagens = chatWindow.querySelectorAll('.chat-message');
    mensagens.forEach((msg, index) => {
      // O 'index > 0' assume que a primeira mensagem é a de boas-vindas
      if (index > 0) {
        msg.remove();
      }
    });
  }

  /**
   * Inicialização com proteção contra múltiplas execuções
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    // Pequeno delay para garantir que todos os elementos estão prontos
    setTimeout(iniciarChat, 100);
  }
})();
