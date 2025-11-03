/**
 * ============================================
 * AGENTE STJ - SCRIPT PRINCIPAL
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
    agentId: 'stj',
    agentName: 'Agente Tax - Consultor STJ',
    apiContext: 'JURIDICO_STJ',
    // Mensagem usada ao fechar (retirada do .js original)
    closingMessage:
      'Conversa encerrada. Sempre que precisar revisar precedentes do STJ, reabra este agente.'
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
   * (Conte�do extra�do do JS original que voc� forneceu)
   */
  function adicionarMensagemInicial() {
    const mensagemInicial = `Ol�! Sou o **assistente especializado em STJ** do TaxHub IA.
      <br><br>
      Comigo voc� pode:
      <ul>
        <li>Mapear temas repetitivos e recursos especiais de destaque</li>
        <li>Comparar decis�es das turmas de direito p�blico</li>
        <li>Verificar modula��o de efeitos e aplica��o em execu��es fiscais</li>
        <li>Entender posicionamentos sobre decad�ncia, multa e juros</li>
        <li>Preparar resumos para peti��es e memoriais</li>
      </ul>
      Qual precedente do STJ voc� precisa compreender agora?`;

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

    // *** CONTE�DO ADAPTADO PARA STJ (do JS original) ***
    const placeholders = [
      'Tema repetitivo sobre ICMS na base do PIS Cofins?',
      'Quais decis�es tratam de contribui��o previdenci�ria em verbas indenizat�rias?',
      'Algum leading case sobre cr�ditos de IPI?',
      'Como o STJ interpreta decad�ncia do lan�amento suplementar?'
    ];
    let placeholderIndex = 0;

    // L�gica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      // S� troca se o utilizador n�o estiver a digitar
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5200);

    // Efeito de "zoom" no bot�o de enviar ao digitar (Padr�o)
    messageInput.addEventListener('input', () => {
      const possuiTexto = messageInput.value.trim().length > 0;
      sendButton.style.transform = possuiTexto ? 'scale(1.05)' : 'scale(1)';
      // *** AJUSTE: Usando o box-shadow padr�o (Laranja) ***
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
   * Fun��o principal do fluxo.
   */
  function enviarMensagem() {
    // Bloqueia envios duplicados
    if (enviandoMensagem || chatFechado) return;
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    if (!messageInput || !sendButton) return;

    // Pegamos a mensagem do input
    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      return; // N�o envia mensagens vazias
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
    }, 1200 + Math.random() * 1000);
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
    
    // *** �CONE ADAPTADO PARA STJ ***
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-gavel' : 'fa-solid fa-user';
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
    avatarIcon.className = 'fa-solid fa-gavel'; // �cone do STJ
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
   * uma resposta pr�-definida (l�gica migrada do JS original).
   *
   * @param {string} mensagem - O texto enviado pelo utilizador.
   * @returns {string} - A resposta do bot (texto).
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('icms') && texto.includes('pis')) {
      return `O STJ, no **Tema 69**, decidiu que o ICMS n�o integra a base de c�lculo de PIS/Cofins.

**Aspectos relevantes:**
<ul>
  <li>Tese firmada em recurso repetitivo com efeito vinculante.</li>
  <li>Julgamento baseado no REsp 1532221/PR (1� Se��o).</li>
  <li>Necessidade de modula��o de efeitos aguardando STF, mas STJ aplica precedentes.</li>
  <li>Empresas podem compensar cr�ditos observando limites da Receita Federal.</li>
</ul>
Documente liquida��es e guarda de notas fiscais para segurar eventual fiscaliza��o.`;
    }

    if (texto.includes('verba') || texto.includes('indenizat�ria') || texto.includes('folha')) {
      return `O STJ tem v�rios precedentes sobre **contribui��o previdenci�ria em verbas indenizat�rias**.

**Resumo:**
<ul>
  <li>Aux�lio-doen�a nos primeiros 15 dias n�o sofre contribui��o.</li>
  <li>Ter�o de f�rias possui entendimento oscilante, mas prevalece incid�ncia.</li>
  <li>Aviso pr�vio indenizado n�o integra base.</li>
  <li>Multa do art. 477 CLT n�o sofre contribui��o.</li>
</ul>
Consulte os Temas 479 e 738 para alinhar defesa com atual jurisprud�ncia.`;
    }

    if (texto.includes('decad�ncia') || texto.includes('lan�amento') || texto.includes('prazo')) {
      return `No STJ, a decad�ncia para lan�amentos tribut�rios segue o **art. 150, par�grafo 4�**, quando h� pagamento antecipado.

**Pontos chave:**
<ul>
  <li>Em tributos sujeitos a lan�amento por homologa��o, prazo � de 5 anos contados do fato gerador.</li>
  <li>Se n�o houve pagamento, aplica-se art. 173, inciso I.</li>
  <li>Para contribui��es previdenci�rias, entender o Tema 263 (REsp 973733).</li>
  <li>Emprego de embargos � execu��o e exce��o de pr�-executividade com base na tese.</li>
</ul>
Prepare demonstrativos com datas dos fatos geradores para comprovar decad�ncia.`;
    }

    if (texto.includes('modula��o') || texto.includes('efeito') || texto.includes('repetitivo')) {
      return `Em temas repetitivos, o STJ pode modular efeitos para preservar seguran�a jur�dica.

**Observa��es:**
<ul>
  <li>Modula��o depende de qu�rum qualificado e fundamenta��o expressa.</li>
  <li>Pode limitar efeitos a partir da publica��o do ac�rd�o ou do julgamento.</li>
  <li>Tribunais inferiores devem observar modula��o ao aplicar precedente.</li>
  <li>Recomenda-se acompanhar os informativos de jurisprud�ncia e boletins do STJ.</li>
</ul>
Ao estruturar defesas, registre a data de ci�ncia oficial do repetitivo.`;
    }

    // Resposta Padr�o (Fallback)
    // Se o bot n�o entender, ele se apresenta novamente.
    return `Como especialista em **jurisprud�ncia do STJ**, estou pronto para:
<ul>
  <li>Pesquisar temas repetitivos e recursos representativos</li>
  <li>Sintetizar ratio decidendi de ac�rd�os relevantes</li>
  <li>Comparar posi��es da 1� e 2� Turmas de direito p�blico</li>
  <li>Evidenciar modula��es e orienta��es a tribunais regionais</li>
  <li>Apoiar a constru��o de memoriais e peti��es t�cnicas</li>
</ul>
Conte mais detalhes e avan�amos juntos na an�lise.`;
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
          <strong>?? Erro ao iniciar o agente STJ</strong><br><br>
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