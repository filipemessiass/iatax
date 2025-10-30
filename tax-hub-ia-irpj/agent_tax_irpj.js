/**
 * ============================================
 * AGENT TAX CONSULT IRPJ - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * ============================================
 */

(() => {
  // Configuração do Agente
  const CONFIG = {
    agentId: 'irpj',
    agentName: 'Agente Tax Consultor IRPJ e CSLL',
    apiContext: 'IRPJ',
    closingMessage: 'Conversa encerrada. Para iniciar um novo atendimento, selecione novamente o agente IRPJ e CSLL.'
  };
  let chatFechado = false;

  /**
   * Notifica o fechamento do chat para a aplicação principal
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
        console.warn('Não foi possível restaurar o conteúdo inicial:', erro);
      }
    }

    // Compatibilidade com listeners antigos e novos
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
      console.error('initializeAgentChat não está disponível para o agente IRPJ.');
      mostrarErroNoChat();
      return;
    }

    try {
      // Inicializa o chat com as configurações
      initializeAgentChat(CONFIG);
      
      // Adiciona listeners adicionais específicos do agente
      adicionarListenersCustomizados();
      
      // Configura auto-resize do textarea
      configurarAutoResize();
      
      // Configura atalhos de teclado
      configurarAtalhosTeclado();
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (error) {
      console.error('Erro ao inicializar o agente IRPJ:', error);
      mostrarErroNoChat();
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
        
        console.log('Fechando chat IRPJ...');
        
        // Esconde o chat
        chatContainer.style.display = 'none';
        
        // Adiciona classe de fechado
        chatContainer.classList.add('chat-closed');
        
        notificarFechamento();
      });
      
      console.log('Botão de fechar configurado com sucesso');
    } else {
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
    const closeButton = document.querySelector('.close-chat-button');
    const chatContainer = document.getElementById('chat-container');

    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      console.warn('Elementos do chat não encontrados para adicionar listeners.');
      return;
    }

    // Listener para o botão de fechar
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (chatContainer) {
          chatContainer.style.display = 'none';
          
          // Adiciona classe para indicar que o chat foi fechado
          chatContainer.classList.add('chat-closed');

          notificarFechamento();
          
          // Você pode adicionar aqui a lógica para voltar ao menu
          // ou esconder o chat container completamente
          console.log('Chat fechado pelo usuário');
        }
      });
    }

    // Previne refresh da página no submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      enviarMensagem();
    });

    // Placeholder dinâmico
    let placeholderIndex = 0;
    const placeholders = [
      'Escreva sua pergunta sobre IRPJ...',
      'Como calcular o IRPJ?',
      'Qual o prazo para pagar o IRPJ?',
      'Diferença entre Lucro Real e Presumido?',
      'Como funciona a CSLL?'
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
        ? '0 12px 32px rgba(220, 152, 74, 0.5)' 
        : '0 8px 24px rgba(220, 152, 74, 0.35)';
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
      const newHeight = Math.min(this.scrollHeight, 150);
      this.style.height = newHeight + 'px';
      
      // Ajusta a altura mínima responsivamente
      const minHeight = window.innerWidth < 480 ? 46 : (window.innerWidth < 768 ? 52 : 56);
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
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-robot' : 'fa-solid fa-user';
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

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-robot';
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
   */
  function gerarRespostaBot(mensagem) {
    const mensagemLower = mensagem.toLowerCase();
    
    // Respostas contextuais baseadas em palavras-chave
    if (mensagemLower.includes('lucro real')) {
      return `O **Lucro Real** é o regime de tributação obrigatório para empresas com faturamento anual superior a R$ 78 milhões ou que exerçam determinadas atividades.

**Características principais:**
- Apuração baseada no lucro líquido contábil
- Pode ser trimestral ou anual
- Permite dedução de todas as despesas operacionais
- Alíquota de 15% sobre o lucro + 10% sobre o que exceder R$ 60 mil no trimestre
- CSLL de 9% (ou 15% para instituições financeiras)

Posso ajudá-lo com algum cálculo específico?`;
    }
    
    if (mensagemLower.includes('lucro presumido')) {
      return `O **Lucro Presumido** é uma forma simplificada de tributação para empresas com faturamento até R$ 78 milhões ao ano.

**Como funciona:**
- Presunção de lucro: 8% a 32% sobre a receita bruta (dependendo da atividade)
- Apuração trimestral obrigatória
- IRPJ de 15% sobre o lucro presumido + 10% sobre o excedente
- CSLL varia conforme a atividade

**Vantagens:** Menor carga tributária quando a margem de lucro é alta.

Gostaria de mais detalhes sobre algum aspecto?`;
    }
    
    if (mensagemLower.includes('prazo') || mensagemLower.includes('pagamento')) {
      return `**Prazos de pagamento do IRPJ:**

**Lucro Real - Trimestral:**
- Pagamento até o último dia útil do mês seguinte ao trimestre

**Lucro Real - Anual:**
- Pagamento mensal estimado
- Ajuste no ano seguinte

**Lucro Presumido:**
- Pagamento trimestral até o último dia útil do mês seguinte

**CSLL:** Segue os mesmos prazos do IRPJ.

Posso ajudar com alguma dúvida específica sobre prazos?`;
    }
    
    if (mensagemLower.includes('csll')) {
      return `A **CSLL (Contribuição Social sobre o Lucro Líquido)** é um tributo federal que incide sobre o lucro das empresas.

**Alíquotas:**
- 9% para a maioria das empresas
- 15% para instituições financeiras
- 20% para empresas de seguros privados

**Base de cálculo:** Segue as mesmas regras do IRPJ (Lucro Real ou Presumido).

**Pagamento:** Mesmos prazos do IRPJ.

Tem alguma dúvida específica sobre CSLL?`;
    }
    
    // Resposta genérica
    return `Obrigado pela sua pergunta! Como especialista em **IRPJ e CSLL**, posso ajudá-lo com:

- **Cálculos** de impostos
- **Regimes** de tributação (Lucro Real, Presumido, Arbitrado)
- **Planejamento** tributário
- **Legislação** fiscal
- **Incentivos** e deduções

Pode me fazer uma pergunta mais específica sobre algum desses temas? Estou aqui para ajudar!`;
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
   * Mostra erro no chat quando a inicialização falha
   */
  function mostrarErroNoChat() {
    // Comentado - será ativado quando conectar com a IA
    /*
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const erroDiv = document.createElement('div');
    erroDiv.className = 'chat-message bot';
    erroDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble" style="background: #fff3cd; border-color: #ffc107; color: #856404;">
          <strong>⚠️ Erro de Inicialização</strong><br><br>
          Não foi possível inicializar o agente IRPJ. Por favor, recarregue a página ou entre em contato com o suporte.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
    */
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
