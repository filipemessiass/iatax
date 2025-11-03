/**
 * ============================================
 * AGENT TAX CONSULT ICMS RN - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * (Versão Padronizada e Autónoma)
 * ============================================
 */

(() => {
  // 1. CONFIGURA�?�fO DO AGENTE
  // Define as informações básicas deste agente
  const CONFIG = {
    agentId: 'icms-rn', 
    agentName: 'Agente Tax - Consultor ICMS - RN',
    apiContext: 'ICMS_RN',
    // AJUSTE DE TEXTO: Corrigido e padronizado
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre ICMS - RN, selecione novamente o agente.'
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
      console.error('Erro ao inicializar o agente ICMS - RN:', erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (PADR�fO)
   * Adiciona a mensagem de boas-vindas do bot quando o chat é iniciado.
   */
  function adicionarMensagemInicial() {
    // AJUSTE DE TEXTO: Texto movido do HTML e corrigido para UTF-8
    const mensagemInicial = `Olá! Eu sou o seu assistente dedicado ao <strong>ICMS do Rio Grande do Norte</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Legislação estadual, decretos, protocolos e convênios do estado;</li>
        <li>Benefícios fiscais (PROEDI), incentivos regionais e programas de desenvolvimento;</li>
        <li>Substituição tributária, diferencial de alíquotas e operações interestaduais;</li>
        <li>Obrigações acessórias estaduais (EFD ICMS/IPI, GIM, GNRE, entre outras);</li>
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
      'Descreva sua dúvida sobre o ICMS do Rio Grande do Norte...',
      'Como funciona o PROEDI?',
      'Qual a MVA da ST para cimento no RN?',
      'O que é o FECOP do RN?'
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
   * AJUSTE DE TEXTO: Respostas criadas para ICMS Rio Grande do Norte (RN).
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('proedi') || (texto.includes('benefício') && texto.includes('rn'))) {
      return `O **PROEDI (Programa de Estímulo ao Desenvolvimento Industrial)** é o principal incentivo fiscal do Rio Grande do Norte, substituindo o antigo PROADI.
      
      **O que oferece:**
      <ul>
        <li>Concede um **Crédito Presumido** de ICMS, que pode variar de 75% a 95% sobre o saldo devedor do imposto.</li>
        <li>O percentual exato depende do tipo de atividade e da localização da empresa (priorizando o interior).</li>
        <li>Exige o recolhimento de uma taxa de 2% sobre o valor do incentivo para fundos estaduais.</li>
      </ul>
      A adesão depende de aprovação e assinatura de um Termo de Acordo com o governo do estado.`;
    }

    if (texto.includes('st') || (texto.includes('substituição') && texto.includes('rn'))) {
      return `O **ICMS-ST no Rio Grande do Norte** segue as regras gerais dos convênios CONFAZ, mas possui particularidades:
      
      **Pontos de Atenção:**
      1.  **MVA/IVA-ST:** O RN utiliza as MVAs (Margens de Valor Agregado) definidas nos convênios e protocolos. Em alguns casos, pode estabelecer MVAs próprias em decreto.
      2.  **Ressarcimento:** O processo de ressarcimento do ICMS-ST (para saídas interestaduais) é regulamentado pelo RICMS/RN e exige procedimentos específicos na EFD.
      3.  **Obrigações:** A **GIM (Guia de Informação e Apuração Mensal do ICMS)** é uma obrigação acessória importante no RN, além da EFD ICMS/IPI.`;
    }

    if (texto.includes('alíquota') || texto.includes('difal') || texto.includes('aliquota interna')) {
      return `A **Alíquota Interna** padrão do ICMS no Rio Grande do Norte é de **20%** (a partir de 2024).
      
      **DIFAL (Diferencial de Alíquotas):**
      No cálculo do DIFAL (para consumidor final não contribuinte, EC 87/2015), utiliza-se esta alíquota interna.
      
      **Exemplo:** Venda de SP (12%) para RN (20%) para consumidor final:
      <ul>
        <li>O DIFAL devido ao RN será de **8%** (20% - 12%).</li>
      </ul>
      
      **FECOP:** O RN também possui o **FECOP** (Fundo Estadual de Combate à Pobreza), que adiciona 2% a produtos "supérfluos" (como bebidas alcoólicas, cigarros, etc.), elevando a alíquota desses itens para **22%**.`;
    }

    // Resposta Padrão (corrigida)
    return `Sou o especialista em <strong>ICMS do Rio Grande do Norte</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Legislação estadual, decretos, protocolos e convênios do estado;</li>
        <li>Benefícios fiscais (PROEDI), incentivos regionais e programas de desenvolvimento;</li>
        <li>Substituição tributária, diferencial de alíquotas e operações interestaduais;</li>
        <li>Obrigações acessórias estaduais (EFD ICMS/IPI, GIM, GNRE, entre outras);</li>
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
          <strong>�s�️ Erro ao iniciar o agente ICMS - RN</strong><br><br>
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
