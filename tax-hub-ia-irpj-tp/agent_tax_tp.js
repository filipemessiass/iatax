/**
 * ============================================
 * AGENT TAX CONSULT TP - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validaÃ§Ãµes
 * ============================================
 */

(() => {
  // ConfiguraÃ§Ã£o do Agente
  const CONFIG = {
    agentId: 'tp',
    agentName: 'Agente Tax Consultor Transfer Pricing',
    apiContext: 'TRANSFER_PRICING',
    closingMessage: 'Conversa encerrada. Para reiniciar um atendimento sobre Transfer Pricing, selecione novamente o agente.'
  };
  let chatFechado = false;

  /**
   * Notifica o fechamento do chat para a aplicaÃ§Ã£o principal
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }

    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        console.warn('NÃ£o foi possÃ­vel restaurar o conteÃºdo inicial:', erro);
      }
    }

    document.dispatchEvent(new CustomEvent('chatClosed', { detail: detalhe }));
    document.dispatchEvent(new CustomEvent('chat:closed', { detail: detalhe }));

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
        console.warn('NÃ£o foi possÃ­vel enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  /**
   * FunÃ§Ã£o de inicializaÃ§Ã£o do chat
   */
  function iniciarChat() {
    // Configura o botÃ£o de fechar PRIMEIRO
    configurarBotaoFechar();
    
    // Verifica se a funÃ§Ã£o global de inicializaÃ§Ã£o existe
    if (typeof initializeAgentChat !== 'function') {
      console.error('initializeAgentChat nÃ£o estÃ¡ disponÃ­vel para o agente Transfer Pricing.');
      return;
    }

    try {
      // Inicializa o chat com as configuraÃ§Ãµes
      initializeAgentChat(CONFIG);
      
      // Adiciona listeners adicionais especÃ­ficos do agente
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
   * Configura o botÃ£o de fechar o chat
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
      
      console.log('BotÃ£o de fechar configurado com sucesso');
    } else {
      console.warn('BotÃ£o de fechar ou container nÃ£o encontrado');
    }
  }

  /**
   * Adiciona listeners customizados para melhorar a experiÃªncia
   */
  function adicionarListenersCustomizados() {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');
    const closeButton = document.querySelector('.close-chat-button');
    const chatContainer = document.getElementById('chat-container');

    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      console.warn('Elementos do chat nÃ£o encontrados para adicionar listeners.');
      return;
    }

    // Listener para o botÃ£o de fechar
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (chatContainer) {
          chatContainer.style.display = 'none';
          
          // Adiciona classe para indicar que o chat foi fechado
          chatContainer.classList.add('chat-closed');
          
          notificarFechamento();
          
          // VocÃª pode adicionar aqui a lÃ³gica para voltar ao menu
          // ou esconder o chat container completamente
          console.log('Chat fechado pelo usuÃ¡rio');
        }
      });
    }

    // Previne refresh da pÃ¡gina no submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      enviarMensagem();
    });

    // Placeholder dinÃ¢mico
    let placeholderIndex = 0;
    const placeholders = [
      'Escreva sua pergunta sobre Transfer Pricing...',
      'Qual mÃ©todo de TP usar?',
      'Como documentar operaÃ§Ãµes com partes relacionadas?',
      'O que Ã© anÃ¡lise de comparabilidade?',
      'Quais sÃ£o as obrigaÃ§Ãµes acessÃ³rias de TP?'
    ];

    // Alterna placeholder a cada 5 segundos quando input estÃ¡ vazio
    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = placeholders[placeholderIndex] + ' (Shift+Enter para nova linha)';
      }
    }, 5000);

    // Visual feedback no botÃ£o de enviar
    messageInput.addEventListener('input', () => {
      const hasText = messageInput.value.trim().length > 0;
      sendButton.style.transform = hasText ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = hasText 
        ? '0 12px 32px rgba(220, 152, 74, 0.5)' 
        : '0 8px 24px rgba(220, 152, 74, 0.35)';
    });

    // Scroll suave para Ãºltima mensagem
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: 'smooth'
      });
    });

    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * Configura auto-resize do textarea baseado no conteÃºdo
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    
    if (!messageInput) return;

    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      const newHeight = Math.min(this.scrollHeight, 140);
      this.style.height = newHeight + 'px';
      
      // Ajusta a altura mÃ­nima responsivamente
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (confirm('Deseja limpar o histÃ³rico de conversa?')) {
          limparChat();
        }
      }
    });
  }

  /**
   * Envia mensagem do usuÃ¡rio
   */
  function enviarMensagem() {
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');
    
    if (!messageInput || !chatWindow) return;

    const mensagem = messageInput.value.trim();
    
    if (mensagem === '') {
      // Feedback visual de campo vazio
      messageInput.style.borderColor = '#dc3545';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }

    // Adiciona mensagem do usuÃ¡rio
    adicionarMensagem('user', mensagem);
    
    // Limpa input e reseta altura
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    // Mostra indicador de digitaÃ§Ã£o
    mostrarIndicadorDigitacao();

    // Simula resposta do bot (aqui vocÃª integraria com sua API)
    setTimeout(() => {
      removerIndicadorDigitacao();
      const resposta = gerarRespostaBot(mensagem);
      adicionarMensagem('bot', resposta);
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
    
    // Se marked.js estÃ¡ disponÃ­vel, renderiza markdown
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
   * Mostra indicador de digitaÃ§Ã£o
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

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
   * Remove indicador de digitaÃ§Ã£o
   */
  function removerIndicadorDigitacao() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Gera resposta do bot (simulaÃ§Ã£o - substituir por chamada real Ã  API)
   */
  function gerarRespostaBot(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    // Respostas contextuais baseadas em palavras-chave
    if (mensagemLower.includes('pic') || mensagemLower.includes('preÃ§o independente comparado')) {
      return `O **MÃ©todo PIC (PreÃ§o Independente Comparado)** Ã© um dos mÃ©todos mais diretos de Transfer Pricing.

**CaracterÃ­sticas:**
- Compara preÃ§o praticado com partes relacionadas com preÃ§o de mercado
- Preferencialmente usado quando hÃ¡ comparÃ¡veis diretos disponÃ­veis
- AplicÃ¡vel tanto para importaÃ§Ã£o quanto exportaÃ§Ã£o
- Requer anÃ¡lise de comparabilidade rigorosa

**Vantagens:**
- Mais prÃ³ximo da realidade de mercado
- Maior aceitaÃ§Ã£o pelas autoridades fiscais

**Desafios:**
- Dificuldade em encontrar comparÃ¡veis perfeitos
- Necessidade de ajustes de comparabilidade

Posso ajudÃ¡-lo com algum aspecto especÃ­fico do PIC?`;
    }
    
    if (mensagemLower.includes('prl') || mensagemLower.includes('preÃ§o de revenda')) {
      return `O **MÃ©todo PRL (PreÃ§o de Revenda menos Lucro)** Ã© utilizado principalmente para operaÃ§Ãµes de importaÃ§Ã£o de bens.

**Como funciona:**
- Parte do preÃ§o de revenda no mercado brasileiro
- Deduz margem de lucro adequada
- Resulta no preÃ§o de transferÃªncia aceitÃ¡vel

**AplicaÃ§Ã£o:**
- Ideal para distribuidores/revendedores
- Requer anÃ¡lise de margens brutas de comparÃ¡veis
- Margem fixa de 20% para importaÃ§Ãµes quando nÃ£o hÃ¡ comparÃ¡veis (safe harbor)

**CÃ¡lculo bÃ¡sico:**
PreÃ§o TP = PreÃ§o Revenda Ã— (1 - Margem Lucro Bruta)

Tem dÃºvidas sobre a aplicaÃ§Ã£o do PRL?`;
    }
    
    if (mensagemLower.includes('cpl') || mensagemLower.includes('custo de produÃ§Ã£o')) {
      return `O **MÃ©todo CPL (Custo de ProduÃ§Ã£o mais Lucro)** Ã© usado principalmente para exportaÃ§Ãµes.

**CaracterÃ­sticas:**
- Baseia-se nos custos de produÃ§Ã£o
- Adiciona margem de lucro adequada
- AplicÃ¡vel quando hÃ¡ dificuldade em obter comparÃ¡veis externos

**FÃ³rmula:**
PreÃ§o TP = Custo ProduÃ§Ã£o Ã— (1 + Margem Lucro)

**Margem de lucro:**
- Determinada por anÃ¡lise de comparÃ¡veis
- Safe harbor: margem fixa de 15% para exportaÃ§Ãµes

**Quando usar:**
- Manufatura de produtos especÃ­ficos
- PrestaÃ§Ã£o de serviÃ§os especializados
- Quando o vendedor nÃ£o agrega valor significativo

Precisa de mais informaÃ§Ãµes sobre CPL?`;
    }
    
    if (mensagemLower.includes('documentaÃ§Ã£o') || mensagemLower.includes('compliance')) {
      return `A **documentaÃ§Ã£o de Transfer Pricing** Ã© essencial para compliance fiscal no Brasil.

**ObrigaÃ§Ãµes principais:**

1. **Master File (Arquivo Mestre)**
   - VisÃ£o global do grupo empresarial
   - Prazo: atÃ© o Ãºltimo dia Ãºtil de setembro

2. **Local File (Arquivo Local)**
   - OperaÃ§Ãµes especÃ­ficas da empresa brasileira
   - Prazo: atÃ© o Ãºltimo dia Ãºtil de setembro

3. **Country-by-Country Report (CbCR)**
   - Para grupos com receita consolidada > R$ 2,26 bilhÃµes
   - Prazo: atÃ© 31 de julho

4. **DeclaraÃ§Ã£o de OperaÃ§Ãµes com Partes Relacionadas**
   - Detalhamento das transaÃ§Ãµes
   - Entregue junto com a ECF

**Penalidades por nÃ£o conformidade:**
- Multas de atÃ© R$ 100.000
- AutuaÃ§Ãµes fiscais

Posso ajudÃ¡-lo com algum documento especÃ­fico?`;
    }
    
    if (mensagemLower.includes('in 2132') || mensagemLower.includes('in 2.132') || mensagemLower.includes('legislaÃ§Ã£o')) {
      return `A **IN RFB 2.132/2023** atualizou as regras de Transfer Pricing no Brasil, alinhando-as Ã s diretrizes OCDE.

**Principais mudanÃ§as:**

âœ“ **Novos mÃ©todos:**
- MÃ©todo da Margem LÃ­quida da TransaÃ§Ã£o (MMLT)
- MÃ©todo da DivisÃ£o de Lucros (MDL)

âœ“ **AnÃ¡lise de comparabilidade:**
- CritÃ©rios mais rigorosos
- Necessidade de ajustes detalhados

âœ“ **DocumentaÃ§Ã£o:**
- Master File, Local File e CbCR obrigatÃ³rios
- Estrutura alinhada Ã  OCDE

âœ“ **Safe harbors:**
- Mantidos para operaÃ§Ãµes especÃ­ficas
- Margens de 20% (PRL) e 15% (CPL)

âœ“ **VigÃªncia:**
- A partir do ano-calendÃ¡rio 2024

**Impactos:**
- Maior complexidade na anÃ¡lise
- Necessidade de estudos econÃ´micos robustos
- Alinhamento com prÃ¡ticas internacionais

Tem dÃºvidas sobre alguma mudanÃ§a especÃ­fica?`;
    }
    
    // Resposta genÃ©rica
    return `Obrigado pela sua pergunta sobre **Transfer Pricing**! Como especialista em preÃ§os de transferÃªncia, posso ajudÃ¡-lo com:

- ðŸ“Š **MÃ©todos de precificaÃ§Ã£o** (PIC, PRL, CPL, PSL, PECEX, MMLT, MDL)
- ðŸ“‹ **DocumentaÃ§Ã£o obrigatÃ³ria** (Master File, Local File, CbCR)
- ðŸ” **AnÃ¡lise de comparabilidade**
- âš–ï¸ **Compliance fiscal**
- ðŸŒ **OperaÃ§Ãµes internacionais**
- ðŸ“– **IN RFB 2.132/2023**

Pode me fazer uma pergunta mais especÃ­fica? Estou aqui para ajudar com seus desafios em Transfer Pricing!`;
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
      if (index > 0) {
        msg.remove();
      }
    });
  }

  /**
   * InicializaÃ§Ã£o com proteÃ§Ã£o contra mÃºltiplas execuÃ§Ãµes
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    // Pequeno delay para garantir que todos os elementos estÃ£o prontos
    setTimeout(iniciarChat, 100);
  }
})();

