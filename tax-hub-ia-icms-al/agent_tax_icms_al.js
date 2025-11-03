/**
 * ============================================
 * AGENT TAX CONSULT ICMS AL - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * (Versão Padronizada e Autónoma)
 * ============================================
 */

(() => {
  // 1. CONFIGURA�?�fO DO AGENTE
  // Define as informações básicas deste agente
  const CONFIG = {
    agentId: 'icms-al', 
    agentName: 'Agente Tax - Consultor ICMS - AL',
    apiContext: 'ICMS_AL',
    // AJUSTE DE TEXTO: Corrigido e padronizado
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre ICMS - AL, selecione novamente o agente.'
  };

  let chatFechado = false;
  let enviandoMensagem = false; // Controla se uma resposta da API está pendente

  /**
   * 2. NOTIFICAR FECHAMENTO
   * Avisa o menu principal que este chat foi fechado.
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
   * 3. INICIALIZA�?�fO DO CHAT (PADRONIZADO)
   * A função principal que é chamada quando o agente é carregado.
   */
  function iniciarChat() {
    configurarBotaoFechar();
    
    // AJUSTE DE L�"GICA: Removemos a dependência do 'initializeAgentChat'
    try {
      adicionarListenersCustomizados();
      configurarAutoResize();
      configurarAtalhosTeclado();
      adicionarMensagemInicial(); // Adiciona a mensagem de boas-vindas
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error('Erro ao inicializar o agente ICMS - AL:', erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (PADR�fO)
   * Adiciona a mensagem de boas-vindas do bot quando o chat é iniciado.
   */
  function adicionarMensagemInicial() {
    // AJUSTE DE TEXTO: Texto movido do HTML e corrigido para UTF-8
    const mensagemInicial = `Olá! Eu sou o seu assistente dedicado ao <strong>ICMS de Alagoas</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Legislação estadual, decretos, protocolos e convênios do estado;</li>
        <li>Benefícios fiscais, incentivos regionais e programas de desenvolvimento;</li>
        <li>Substituição tributária, diferencial de alíquotas e operações interestaduais;</li>
        <li>Obrigações acessórias estaduais (EFD ICMS/IPI, GIA, GNRE, entre outras);</li>
        <li>Procedimentos de fiscalização, conciliação de documentos fiscais e regimes especiais.</li>
      </ul>
      Em que posso apoiar você hoje?`;

    adicionarMensagem('bot', mensagemInicial);
  }


  /**
   * 4. CONFIGURAR BOT�fO DE FECHAR
   * Encontra o botão no HTML e adiciona o evento de clique.
   */
  function configurarBotaoFechar() {
    const closeButton = document.querySelector('[data-close-chat]');
    const chatContainer = document.getElementById('chat-container');

    if (closeButton && chatContainer) {
      closeButton.addEventListener('click', (evento) => {
        evento.preventDefault();
        evento.stopImmediatePropagation();

        chatContainer.style.display = 'none';
        chatContainer.classList.add('chat-closed');

        notificarFechamento();
      });
    } else {
      console.warn('Botão de fechar ou container do chat não encontrado.');
    }
  }

  /**
   * 5. LISTENERS CUSTOMIZADOS
   * Adiciona melhorias de experiência do utilizador (UX).
   */
  function adicionarListenersCustomizados() {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');

    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      console.warn('Elementos essenciais do chat não encontrados.');
      return;
    }
    
    // Ouve o 'submit' do formulário (clicar no botão ou pressionar Enter)
    chatForm.addEventListener('submit', (evento) => {
      evento.preventDefault();
      evento.stopPropagation(); 
      enviarMensagem();
    });

    // AJUSTE DE TEXTO: Placeholders corrigidos para UTF-8
    const placeholders = [
      'Descreva sua dúvida sobre o ICMS de Alagoas...',
      'Como funciona o benefício fiscal do PRODESIN?',
      'Qual a MVA da ST para bebidas em AL?',
      'Como calcular o DIFAL em Alagoas?',
      'Quais são as regras do FECOEP?'
    ];
    let placeholderIndex = 0;

    // Lógica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5000);

    // Efeito de "zoom" no botão de enviar ao digitar (Padrão IRPJ)
    messageInput.addEventListener('input', () => {
      const possuiTexto = messageInput.value.trim().length > 0;
      sendButton.style.transform = possuiTexto ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = possuiTexto
        ? '0 12px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 24px rgba(0, 0, 0, 0.3)';
    });

    // Observador para rolar o chat para baixo automaticamente
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * 6. CONFIGURAR AUTO-RESIZE (PADRONIZADO)
   * Faz a caixa de texto crescer e encolher conforme o utilizador digita.
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      const novaAltura = Math.min(this.scrollHeight, 140); // Limite de 140px
      this.style.height = `${novaAltura}px`;

      // Altura mínima padronizada (IRPJ)
      const alturaMinima = window.innerWidth < 480 ? 50 : window.innerWidth < 768 ? 52 : 58;
      if (novaAltura < alturaMinima) {
        this.style.height = `${alturaMinima}px`;
      }
    });

    messageInput.addEventListener('blur', function () {
      if (this.value.trim() === '') {
        this.style.height = 'auto';
      }
    });
  }

  /**
   * 7. CONFIGURAR ATALHOS DE TECLADO
   * Define o que "Enter" e "Ctrl+K" fazem.
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        document.getElementById('chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
      }

      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault();
        if (confirm('Deseja limpar o histórico da conversa?')) {
          limparChat();
        }
      }
    });
  }

  /**
   * 8. ENVIAR MENSAGEM (L�"GICA AUT�"NOMA)
   * Função chamada ao enviar o formulário.
   */
  function enviarMensagem() {
    if (enviandoMensagem || chatFechado) return;
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatWindow = document.getElementById('chat-window');

    if (!messageInput || !chatWindow || !sendButton) return;

    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      messageInput.style.borderColor = '#7AC143';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }
    
    enviandoMensagem = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    adicionarMensagem('user', mensagem);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    mostrarIndicadorDigitacao();

    // ================================================================
    // INTEGRA�?�fO COM API (SIMULA�?�fO)
    // ================================================================
    // Este agente está a usar uma simulação (setTimeout).
    // Para ligar à API real, substitua este bloco 'setTimeout'
    // pela lógica 'try/catch/fetch' do ficheiro 'agent_tax_irpj.js'.
    // ================================================================
    setTimeout(() => {
      removerIndicadorDigitacao();
      const resposta = gerarRespostaBot(mensagem);
      adicionarMensagem('bot', resposta);
      
      enviandoMensagem = false;
      if (!chatFechado) {
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.focus();
      }
    }, 1400 + Math.random() * 900);
  }

  /**
   * 9. ADICIONAR MENSAGEM (CRIA�?�fO DE HTML)
   * Função que constrói o HTML de uma nova mensagem e a insere no chat.
   */
  function adicionarMensagem(tipo, conteudo) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `chat-message ${tipo}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    // Define o ícone com base no tipo
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-landmark' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // Usa 'marked' para formatar o texto (negrito, listas, etc.)
    if (typeof marked !== 'undefined') {
      try {
        bubbleDiv.innerHTML = marked.parse(conteudo);
      } catch(e) {
        bubbleDiv.textContent = conteudo; // Fallback se 'marked' falhar
      }
    } else {
      bubbleDiv.textContent = conteudo;
    }

    contentDiv.appendChild(bubbleDiv);
    mensagemDiv.appendChild(avatarDiv);
    mensagemDiv.appendChild(contentDiv);
    chatWindow.appendChild(mensagemDiv);
  }

  /**
   * 10. INDICADOR DE DIGITA�?�fO
   * Funções para mostrar e esconder o "..."
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    removerIndicadorDigitacao(); 

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-landmark';
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

  function removerIndicadorDigitacao() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * 11. RESPOSTAS SIMULADAS (L�"GICA DO BOT)
   * AJUSTE DE TEXTO: Respostas criadas para ICMS Alagoas.
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('prodesin') || (texto.includes('benefício') && texto.includes('alagoas'))) {
      return `O **PRODESIN** (Programa de Desenvolvimento Integrado do Estado de Alagoas) é um dos principais incentivos fiscais de AL.
      
      **O que oferece:**
      <ul>
        <li>Crédito presumido de ICMS (geralmente 92%) nas saídas de produção própria.</li>
        <li>Diferimento (adiamento) do ICMS sobre a importação de máquinas (ativo imobilizado).</li>
        <li>Diferimento do ICMS sobre a aquisição interna de energia e gás.</li>
      </ul>
      Para aderir, a empresa precisa de um projeto aprovado pelo CONEDES (Conselho Estadual de Desenvolvimento Econômico e Social).`;
    }

    if (texto.includes('st') || (texto.includes('substituição') && texto.includes('alagoas'))) {
      return `O **ICMS-ST em Alagoas** segue as regras gerais dos convênios CONFAZ, mas possui particularidades:
      
      **Pontos de Atenção:**
      1.  **MVA/IVA-ST:** Alagoas utiliza suas próprias Margens de Valor Agregado (MVA), que podem diferir das nacionais (Protocolos/Convênios).
      2.  **Ressarcimento:** O processo de ressarcimento do ICMS-ST (quando se vende para outro estado, por exemplo) é regulamentado por decreto estadual e exige arquivos específicos.
      3.  **Fronteiras:** Alagoas possui regimes especiais para atacadistas (como o Decreto 1.738/2003) que podem alterar a forma de recolhimento da ST nas entradas.`;
    }

    if (texto.includes('difal') || texto.includes('diferencial de alíquota')) {
      return `O **DIFAL em Alagoas** segue o padrão nacional da EC 87/2015, mas é crucial observar:
      
      **Alíquota Interna:** A alíquota interna padrão em Alagoas é de **19%**. Para produtos de luxo, pode chegar a **25%**.
      
      **FECOEP:** Alagoas exige o recolhimento do **FECOEP** (Fundo Estadual de Combate e Erradicação da Pobreza), que é um adicional de 1% a 2% sobre a alíquota interna. Este valor deve ser calculado e pago em guia separada.
      
      **Exemplo:** Venda de SP (12%) para AL (19% + 1% FECOEP) para consumidor final:
      <ul>
        <li>DIFAL (ICMS): 7% (19% - 12%) para Alagoas.</li>
        <li>FECOEP: 1% para Alagoas (pago em guia separada).</li>
      </ul>`;
    }

    // Resposta Padrão (corrigida)
    return `Sou o especialista em <strong>ICMS de Alagoas</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Legislação estadual, decretos, protocolos e convênios do estado;</li>
        <li>Benefícios fiscais, incentivos regionais e programas de desenvolvimento;</li>
        <li>Substituição tributária, diferencial de alíquotas e operações interestaduais;</li>
        <li>Obrigações acessórias estaduais (EFD ICMS/IPI, GIA, GNRE, entre outras);</li>
        <li>Procedimentos de fiscalização, conciliação de documentos fiscais e regimes especiais.</li>
      </ul>
      Qual assunto você deseja aprofundar?`;
  }


  /**
   * 12. LIMPAR CHAT
   * Remove todas as mensagens, exceto a primeira (boas-vindas).
   */
  function limparChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagens = chatWindow.querySelectorAll('.chat-message');
    mensagens.forEach((msg, index) => {
      if (index > 0) msg.remove(); // index > 0 preserva a mensagem inicial
    });
  }

  /**
   * 13. MOSTRAR ERRO (Fallback)
   * Função de segurança caso a inicialização falhe.
   */
  function mostrarErroNoChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const erroDiv = document.createElement('div');
    erroDiv.className = 'chat-message bot';
    // AJUSTE DE TEXTO: Corrigido
    erroDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble" style="background: #FFFFFF; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06); border-color: #7AC143; color: #0F0F0F;">
          <strong>�s�️ Erro ao iniciar o agente ICMS - AL</strong><br><br>
          Não foi possível carregar a interface no momento. Recarregue a página ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  /**
   * 14. INICIALIZA�?�fO
   * Dispara a função 'iniciarChat' quando o DOM estiver pronto.
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    setTimeout(iniciarChat, 100);
  }
})();
