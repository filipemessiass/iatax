/**
 * ============================================
 * AGENT TAX CONSULT PER/DCOMP - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com valida��es
 * (Vers�o Padronizada e Aut�noma)
 *
 * Comentários Educativos:
 * Este ficheiro � o "c�rebro" do agente. Ele � "aut�nomo",
 * o que significa que cont�m toda a l�gica necess�ria
 * para o chat funcionar (enviar, receber, simular respostas)
 * sem depender de um script externo.
 * =ENTRY POINT: A fun��o 'iniciarChat' (no final) � o ponto de partida.
 * ============================================
 */

// Usamos uma "IIFE" (Immediately Invoked Function Expression)
// (function() { ... })();
// Isso cria um "�mbito" (scope) privado, protegendo 
// as nossas vari�veis (como 'chatFechado') de conflitos
// com outros scripts na p�gina.
(() => {
  /**
   * SE��O 1: CONFIGURA��O DO AGENTE
   * Define as constantes e vari�veis globais para este agente.
   */
  const CONFIG = {
    agentId: 'perdcomp',
    agentName: 'Agente Tax - Consultor Per Dcomp',
    apiContext: 'PER_DCOMP',
    // Mensagem usada ao fechar (retirada do .js original)
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre PER/DCOMP, selecione novamente o agente.'
  };

  // Vari�veis de "estado" (controlam o estado atual do chat)
  let chatFechado = false;
  let enviandoMensagem = false; // Impede o utilizador de enviar 2+ mensagens ao mesmo tempo

  /**
   * SE��O 2: NOTIFICAR FECHAMENTO (Fun��o Padr�o)
   * Avisa o 'menu principal' (a p�gina que carregou o agente)
   * que este chat foi fechado pelo utilizador.
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }
    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    // Tenta chamar a fun��o global de restaura��o (se existir)
    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        console.warn('N�o foi poss�vel restaurar o conte�do inicial:', erro);
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
        console.warn('N�o foi poss�vel enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  /**
   * SE��O 3: INICIALIZA��O DO CHAT (Fun��o Principal)
   * Chamada quando o script � carregado. 
   * Configura todos os "ouvintes" (event listeners).
   */
  function iniciarChat() {
    // 1. Configura o bot�o de fechar
    configurarBotaoFechar();
    
    // 2. Tenta configurar o resto
    try {
      adicionarListenersCustomizados(); // Placeholders, etc.
      configurarAutoResize(); // Textarea crescer
      configurarAtalhosTeclado(); // Enviar com Enter
      adicionarMensagemInicial(); // Adiciona o "Ol�!" do bot
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error(`Erro ao inicializar o agente ${CONFIG.agentName}:`, erro);
      mostrarErroNoChat(); // Mostra um erro DENTRO do chat
    }
  }
  
  /**
   * SE��O 3.1: ADICIONAR MENSAGEM INICIAL
   * Injeta a primeira mensagem do bot na janela de chat.
   * O conte�do foi retirado do 'agent_tax_perdcomp.html' original.
   */
  function adicionarMensagemInicial() {
    // Corrigimos a codifica��o (ex: &ccedil; -> �)
    const mensagemInicial = `Ol�! Vamos falar sobre <strong>PER/DCOMP</strong>.
      <br><br>
      Posso apoiar com:
      <ul>
        <li>PER/DCOMP Web, PGD, retifica��o e transmiss�o de pedidos;</li>
        <li>Compensa��es de tributos federais, previdenci�rios e saldos negativos;</li>
        <li>Ressarcimento de PIS/COFINS, IPI, CPRB e cr�ditos de reten��es;</li>
        <li>Acompanhamento de status, intima��es e despacho decis�rio;</li>
        <li>Documenta��o suporte, provas e recursos administrativos.</li>
      </ul>
      Como posso ajudar no seu processo de PER/DCOMP?`;

    adicionarMensagem('bot', mensagemInicial);
  }


  /**
   * SE��O 4: CONFIGURAR BOT�O DE FECHAR
   * Encontra o bot�o (data-close-chat) no HTML e adiciona o 
   * evento de 'click' que chama a 'notificarFechamento'.
   */
  function configurarBotaoFechar() {
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
      console.warn('Bot�o de fechar ou container do chat n�o encontrado.');
    }
  }

  /**
   * SE��O 5: LISTENERS CUSTOMIZADOS (UX)
   * Adiciona melhorias de experi�ncia do utilizador, como os 
   * placeholders rotativos na caixa de texto.
   */
  function adicionarListenersCustomizados() {
    // Seleciona os elementos do DOM (HTML)
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');

    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      console.warn('Elementos essenciais do chat n�o encontrados.');
      return;
    }
    
    // Ouve o 'submit' do formul�rio (clicar no bot�o ou pressionar Enter)
    chatForm.addEventListener('submit', (evento) => {
      evento.preventDefault(); // Impede o recarregamento da p�gina
      evento.stopPropagation(); 
      enviarMensagem(); // Chama a nossa fun��o de envio
    });

    // *** CONTE�DO ADAPTADO PARA PER/DCOMP ***
    const placeholders = [
      'Descreva sua d�vida sobre PER/DCOMP...',
      'Qual a diferen�a de PER/DCOMP Web e PGD?',
      'Como compensar um saldo negativo de IRPJ?',
      'Posso compensar INSS com PIS/COFINS?',
      'Como consultar o status do meu PER/DCOMP?'
    ];
    let placeholderIndex = 0;

    // L�gica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      // S� troca se o utilizador n�o estiver a digitar
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5000);

    // Efeito de "zoom" no bot�o de enviar ao digitar (Padr�o)
    messageInput.addEventListener('input', () => {
      const possuiTexto = messageInput.value.trim().length > 0;
      sendButton.style.transform = possuiTexto ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = possuiTexto
        ? '0 12px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 24px rgba(0, 0, 0, 0.3)';
    });

    // Observador para rolar o chat para baixo automaticamente
    // sempre que uma nova mensagem (child) � adicionada
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * SE��O 6: CONFIGURAR AUTO-RESIZE (Fun��o Padr�o)
   * Faz a 'textarea' crescer e encolher verticalmente 
   * conforme o utilizador digita (at� um limite).
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('input', function () {
      this.style.height = 'auto'; // Reseta a altura
      const novaAltura = Math.min(this.scrollHeight, 140); // Limite de 140px
      this.style.height = `${novaAltura}px`;
    });
  }

  /**
   * SE��O 7: CONFIGURAR ATALHOS DE TECLADO (Fun��o Padr�o)
   * Define o que "Enter" (envia) e "Shift+Enter" (nova linha) fazem.
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (evento) => {
      // Enter (sem Shift) envia o formul�rio
      if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        document.getElementById('chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  /**
   * SE��O 8: ENVIAR MENSAGEM (L�GICA AUT�NOMA)
   * Fun��o principal do fluxo:
   * 1. Pega a mensagem do utilizador.
   * 2. Adiciona o bal�o do utilizador.
   * 3. Mostra o indicador "a digitar...".
   * 4. SIMULA uma chamada de API (setTimeout).
   * 5. Adiciona a resposta do bot.
   */
  function enviarMensagem() {
    // Bloqueia envios duplicados
    if (enviandoMensagem || chatFechado) return;
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    if (!messageInput || !sendButton) return;

    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      // Valida��o de campo vazio
      messageInput.style.borderColor = 'var(--color-danger)';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }
    
    // ----- In�cio do Envio -----
    enviandoMensagem = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    // 1. Adiciona a mensagem do utilizador
    adicionarMensagem('user', mensagem);
    
    // 2. Limpa o input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    // 3. Mostra o "a digitar..."
    mostrarIndicadorDigitacao();

    // ================================================================
    // SE��O 8.1: INTEGRA��O COM API (SIMULA��O)
    // Usamos um 'setTimeout' para simular o tempo de 
    // espera de uma resposta da API (1.2 a 2.0 segundos).
    // ================================================================
    setTimeout(() => {
      removerIndicadorDigitacao(); // Esconde o "..."
      
      // 4. Gera a resposta (L�gica na Se��o 11)
      const resposta = gerarRespostaBot(mensagem);
      
      // 5. Adiciona a resposta do bot
      adicionarMensagem('bot', resposta);
      
      // ----- Fim do Envio -----
      enviandoMensagem = false;
      if (!chatFechado) {
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.focus();
      }
    }, 1200 + Math.random() * 800);
  }

  /**
   * SE��O 9: ADICIONAR MENSAGEM (CRIA��O DE HTML)
   * Fun��o "construtora" que cria o HTML de um novo bal�o 
   * de chat (avatar + bal�o) e o insere na janela.
   * @param {string} tipo - 'bot' ou 'user'
   * @param {string} conteudo - O texto da mensagem (pode conter Markdown)
   */
  function adicionarMensagem(tipo, conteudo) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    // 1. Cria o 'div' principal (a linha toda)
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `chat-message ${tipo}`;

    // 2. Cria o Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    
    // *** �CONE ADAPTADO PARA PER/DCOMP ***
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-file-circle-check' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    // 3. Cria o conte�do (bal�o)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // 4. Processa o texto com 'marked' (converte Markdown para HTML)
    if (typeof marked !== 'undefined') {
      try {
        bubbleDiv.innerHTML = marked.parse(conteudo);
      } catch(e) {
        bubbleDiv.textContent = conteudo; // Fallback se 'marked' falhar
      }
    } else {
      bubbleDiv.textContent = conteudo;
    }

    // 5. Monta a estrutura e adiciona � janela
    contentDiv.appendChild(bubbleDiv);
    mensagemDiv.appendChild(avatarDiv);
    mensagemDiv.appendChild(contentDiv);
    chatWindow.appendChild(mensagemDiv);
  }

  /**
   * SE��O 10: INDICADOR DE DIGITA��O (Fun��es Padr�o)
   * Fun��es que criam e removem o bal�o "..." (loading).
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    removerIndicadorDigitacao(); // Garante que s� existe um

    // Cria o HTML do indicador (similar � Se��o 9)
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator'; // ID para o removermos facilmente

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-file-circle-check'; // �cone do PER/DCOMP
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
   * SE��O 11: RESPOSTAS SIMULADAS (L�GICA DO BOT)
   * *** ESTA � A INTELIG�NCIA SIMULADA DO AGENTE ***
   * Esta fun��o analisa a mensagem do utilizador e escolhe 
   * uma resposta pr�-definida baseada nos t�picos do PER/DCOMP.
   *
   * @param {string} mensagem - O texto enviado pelo utilizador.
   * @returns {string} - A resposta do bot (texto).
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    // T�pico 1: Web vs PGD
    if (texto.includes('web') || texto.includes('pgd') || (texto.includes('qual') && texto.includes('usar'))) {
      return `A diferen�a entre o PER/DCOMP PGD (programa) e o Web (e-CAC) � o tipo de cr�dito:
      
      <ul>
        <li><strong>PER/DCOMP PGD (Programa):</strong> Usado para cr�ditos "n�o-previdenci�rios" mais antigos. Principalmente IPI, PIS/COFINS n�o-cumulativo (ressarcimento), e saldos negativos de IRPJ/CSLL de anos anteriores.</li>
        <li><strong>PER/DCOMP Web (Portal e-CAC):</strong> � o sistema mais novo, focado em cr�ditos "previdenci�rios" (INSS) apurados via eSocial/EFD-Reinf e para compensar d�bitos da DCTFWeb. Tamb�m � usado para saldos negativos de IRPJ/CSLL mais recentes.</li>
      </ul>
      A regra geral �: d�bitos da DCTFWeb s�o compensados via PER/DCOMP Web.`;
    }

    // T�pico 2: Compensa��o / Saldo Negativo
    if (texto.includes('compensar') || texto.includes('saldo negativo') || texto.includes('cruzada')) {
      return `A compensa��o permite usar um cr�dito para pagar um d�bito.
      
      **Regras de Ouro da Compensa��o:**
      <ul>
        <li>**Tributos Federais (RFB):** Cr�ditos de IRPJ, CSLL, PIS e COFINS podem ser usados para pagar *qualquer* um desses tributos. (Ex: Saldo Negativo de IRPJ pode pagar PIS).</li>
        <li>**Tributos Previdenci�rios (INSS):** Cr�dito de INSS (retido a maior, por exemplo) S� pode compensar d�bitos de INSS.</li>
        <li>**Compensa��o Cruzada (INSS com PIS/COFINS):** **N�o � regra geral.** Foi permitida em cen�rios muito espec�ficos de transição do eSocial, mas hoje a regra � que cr�ditos previdenci�rios pagam d�bitos previdenci�rios, e cr�ditos "RFB" (PIS/IRPJ...) pagam d�bitos "RFB".</li>
      </ul>`;
    }

    // T�pico 3: Ressarcimento PIS/COFINS
    if (texto.includes('ressarcimento') || (texto.includes('cr�dito') && (texto.includes('pis') || texto.includes('cofins')))) {
      return `O <strong>Ressarcimento</strong> � o pedido de devolu��o (em dinheiro ou para compensa��o) de cr�ditos de PIS/COFINS n�o-cumulativos.
      
      **Isso ocorre geralmente quando:**
      <ul>
        <li>A empresa � exportadora (vendas com al�quota zero e cr�ditos mantidos).</li>
        <li>A empresa tem muitas vendas com suspens�o, isen��o ou al�quota zero, mas compras com cr�dito.</li>
      </ul>
      O pedido � feito via PER/DCOMP PGD, e exige que os arquivos da EFD Contribuições (Bloco M) estejam corretos e sem pend�ncias.`;
    }
    
    // T�pico 4: Status / Despacho
    if (texto.includes('status') || texto.includes('consultar') || texto.includes('despacho') || texto.includes('n�o homologado')) {
      return `Voc� pode consultar o status do seu PER/DCOMP no e-CAC. Os status mais comuns s�o:
      
      <ul>
        <li>**Em Análise:** A Receita est� processando o pedido.</li>
        <li>**Deferido (Total/Parcial):** O pedido foi aceite (total ou parcialmente).</li>
        <li>**N�o Homologado:** O pedido foi recusado. A Receita emitir� um **Despacho Decis�rio** explicando o motivo da recusa (ex: falta de provas, d�bito j� pago, etc.).</li>
      </ul>
      Se for "N�o Homologado", a empresa tem 30 dias ap�s a ci�ncia para apresentar uma **Manifesta��o de Inconformidade**.`;
    }

    // Resposta Padr�o (Fallback)
    // Se o bot n�o entender, ele se apresenta novamente.
    return `Ol�! Vamos falar sobre <strong>PER/DCOMP</strong>.
      <br><br>
      Posso apoiar com:
      <ul>
        <li>Diferen�as entre PER/DCOMP Web e PGD;</li>
        <li>Regras de compensa��o de saldos negativos e impostos federais;</li>
        <li>Ressarcimento de cr�ditos (PIS/COFINS, IPI);</li>
        <li>Acompanhamento de status e despacho decis�rio.</li>
      </ul>
      Poderia reformular sua pergunta sobre um destes t�picos?`;
  }


  /**
   * SE��O 12: LIMPAR CHAT (Fun��o Padr�o)
   * Remove todas as mensagens da janela de chat, exceto 
   * a primeira (�ndice 0), que � a de boas-vindas.
   */
  function limparChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagens = chatWindow.querySelectorAll('.chat-message');
    mensagens.forEach((msg, index) => {
      // index > 0 preserva a mensagem inicial (index 0)
      if (index > 0) msg.remove();
    });
  }

  /**
   * SE��O 13: MOSTRAR ERRO (Fallback)
   * Fun��o de seguran�a caso a 'iniciarChat' (Se��o 3) falhe.
   * Mostra uma mensagem de erro amig�vel dentro do chat.
   */
  function mostrarErroNoChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    // *** MENSAGEM DE ERRO ADAPTADA ***
    const erroDiv = document.createElement('div');
    erroDiv.className = 'chat-message bot';
    erroDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble" style="background: #FFFFFF; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06); border-color: #7AC143; color: #0F0F0F;">
          <strong>?? Erro ao iniciar o agente PER/DCOMP</strong><br><br>
          N�o foi poss�vel carregar a interface no momento. Recarregue a p�gina ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  /**
   * SE��O 14: INICIALIZA��O (ENTRY POINT)
   * Este � o c�digo que "liga" o agente.
   * Ele espera o HTML estar pronto ('DOMContentLoaded') 
   * e ent�o chama a nossa fun��o 'iniciarChat' (Se��o 3).
   */
  if (document.readyState === 'loading') {
    // Se o script carregar antes do HTML, espera
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    // Se o HTML j� estiver pronto, inicia (com um pequeno delay)
    setTimeout(iniciarChat, 100);
  }
})();