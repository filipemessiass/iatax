/**
 * ============================================
 * AGENT TAX CONSULT RETEN�?�.ES - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * (Versão Padronizada e Autónoma)
 * ============================================
 */

(() => {
  // 1. CONFIGURA�?�fO DO AGENTE
  // Define as informações básicas deste agente
  const CONFIG = {
    agentId: 'retencoes',
    // AJUSTE DE TEXTO: Corrigido "Retencoes"
    agentName: 'Agente Tax - Consultor Retenções',
    apiContext: 'RETENCOES',
    // AJUSTE DE TEXTO: Corrigido "retencoes"
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre retenções, selecione novamente o agente.'
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
      console.error('Erro ao inicializar o agente Retenções:', erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (PADR�fO)
   * Adiciona a mensagem de boas-vindas do bot quando o chat é iniciado.
   */
  function adicionarMensagemInicial() {
    // AJUSTE DE TEXTO: Texto movido do HTML e corrigido para UTF-8
    const mensagemInicial = `Olá! Sou o especialista em <strong>Retenções Tributárias</strong>.
      <br><br>
      Posso orientar sobre:
      <ul>
        <li>Retenções de IRRF, CSLL, PIS/COFINS e INSS em serviços;</li>
        <li>Obrigações dos tomadores (RFB, eSocial, EFD-Reinf e DCTFWeb);</li>
        <li>Tratamento de retenções sobre cooperativas, autônomos e prestadores PJ;</li>
        <li>Regras de cessão de mão de obra, empreitada e subcontratações;</li>
        <li>Compensações, restituições e gestão de comprovantes de retenção.</li>
      </ul>
      Qual retenção gostaria de analisar hoje?`;

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
      'Descreva sua dúvida sobre retenções...',
      'Quando devo reter CSRF (4,65%)?',
      'Como funciona a retenção de INSS (11%)?',
      'Serviços de limpeza têm IRRF?'
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
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-hand-holding-dollar' : 'fa-solid fa-user';
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
    avatarIcon.className = 'fa-solid fa-hand-holding-dollar';
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
   * AJUSTE DE TEXTO: Respostas criadas para Retenções.
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('csrf') || texto.includes('4,65') || texto.includes('pis/cofins/csll')) {
      return `A **CSRF** (ou "PCC") é a retenção de 4,65% (PIS/COFINS/CSLL) sobre pagamentos de serviços prestados por pessoas jurídicas.
      
      **Regras principais:**
      <ul>
        <li>Aplica-se a serviços de limpeza, manutenção, segurança, vigilância, e serviços profissionais (ex: advocacia, engenharia).</li>
        <li>O fato gerador é o **pagamento**.</li>
        <li>Só é devida se o valor do pagamento for superior a R$ 5.000,00 no mês, para o mesmo fornecedor (regra de dispensa).</li>
        <li>Empresas do Simples Nacional **não sofrem** esta retenção, mas **devem** reter se contratarem serviços.</li>
      </ul>`;
    }

    if (texto.includes('inss') || texto.includes('11%') || texto.includes('cessão de mão de obra')) {
      return `A retenção de **11% de INSS** na fonte é devida na contratação de serviços mediante **cessão de mão de obra** ou **empreitada**.
      
      **O que é Cessão de Mão de Obra?**
      �? quando os funcionários da empresa contratada ficam à disposição do contratante, dentro das instalações do tomador (ex: limpeza, segurança, portaria).
      
      **Base de Cálculo:**
      <ul>
        <li>O valor bruto da nota fiscal, fatura ou recibo.</li>
        <li>Podem ser deduzidos materiais ou equipamentos (desde que discriminados em contrato e nota fiscal).</li>
      </ul>
      O valor retido é informado na **EFD-Reinf** e compensado na guia de INSS (DCTFWeb) da empresa prestadora.`;
    }

    if (texto.includes('irrf') || texto.includes('1,5%') || texto.includes('1%')) {
      return `A retenção de **IRRF (Imposto de Renda Retido na Fonte)** sobre serviços de PJ é complexa. As duas principais alíquotas são:
      
      **1. 1,5% (Regra Geral):**
      <ul>
        <li>Aplica-se a serviços de natureza profissional (ex: advocacia, engenharia, consultoria, programação).</li>
        <li>Incide sobre serviços de limpeza, segurança e locação de mão de obra.</li>
      </ul>
      
      **2. 1,0% (Exceção):**
      <ul>
        <li>Aplica-se a serviços de propaganda e publicidade.</li>
      </ul>
      
      O fato gerador é o **pagamento** ou crédito (o que ocorrer primeiro) e a retenção é dispensada se o valor for igual ou inferior a R$ 10,00.`;
    }
    
    // Resposta Padrão (corrigida)
    return `Sou especialista em <strong>Retenções Tributárias</strong>.
      <br><br>
      Posso orientar sobre:
      <ul>
        <li>Retenções de IRRF, CSLL, PIS/COFINS e INSS em serviços;</li>
        <li>Obrigações dos tomadores (RFB, eSocial, EFD-Reinf e DCTFWeb);</li>
        <li>Tratamento de retenções sobre cooperativas, autônomos e prestadores PJ;</li>
        <li>Regras de cessão de mão de obra, empreitada e subcontratações;</li>
        <li>Compensações, restituições e gestão de comprovantes de retenção.</li>
      </ul>
      Qual retenção gostaria de analisar hoje?`;
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
          <strong>�s�️ Erro ao iniciar o agente Retenções</strong><br><br>
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
