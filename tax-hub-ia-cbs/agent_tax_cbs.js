/**
 * ============================================
 * AGENT TAX CONSULT CBS - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com valida��es
 * (Vers�o Padronizada e Aut�noma)
 * ============================================
 */

/* COMENT�RIO EDUCATIVO:
 * Usamos uma IIFE (Immediately Invoked Function Expression),
 * o "(() => { ... })();", para encapsular nosso c�digo.
 * Isso evita que nossas vari�veis (CONFIG, chatFechado, etc.)
 * entrem em conflito com outros scripts na p�gina.
 */
(() => {
  // 1. CONFIGURA��O DO AGENTE
  // COMENT�RIO EDUCATIVO:
  // Armazenamos as informa��es b�sicas do agente em um
  // objeto "CONFIG" para f�cil manuten��o.
  const CONFIG = {
    agentId: 'cbs', 
    agentName: 'Agente Tax - Consultor CBS',
    apiContext: 'CBS',
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre CBS, selecione novamente o agente.'
  };

  // Vari�veis de estado para controlar o chat
  let chatFechado = false;
  let enviandoMensagem = false; // Controla se uma resposta da API est� pendente

  /**
   * 2. NOTIFICAR FECHAMENTO (Padr�o)
   * COMENT�RIO EDUCATIVO:
   * Esta fun��o avisa o "menu principal" (se houver) que
   * este agente foi fechado. Ela dispara "Eventos Customizados"
   * (CustomEvent) que outro script pode "ouvir".
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }
    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    // Tenta chamar fun��es globais (se existirem)
    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        console.warn('N�o foi poss�vel restaurar o conte�do inicial:', erro);
      }
    }

    // Dispara eventos para o menu
    document.dispatchEvent(new CustomEvent('chatClosed', { detail: detalhe }));
    document.dispatchEvent(new CustomEvent('chat:closed', { detail: detalhe }));

    // Tenta enviar mensagem para o "pai" (em caso de iframe)
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
   * 3. INICIALIZA��O DO CHAT (Padr�o)
   * COMENT�RIO EDUCATIVO:
   * A fun��o principal que � chamada quando o agente � carregado.
   * Ela "amarra" todas as outras fun��es: configura bot�es,
   * adiciona a mensagem inicial e prepara os atalhos.
   */
  function iniciarChat() {
    configurarBotaoFechar();
    
    try {
      // Conecta os elementos HTML (form, input, bot�o)
      adicionarListenersCustomizados();
      // Faz a caixa de texto crescer
      configurarAutoResize();
      // Configura o "Enter" para enviar
      configurarAtalhosTeclado();
      // Adiciona a mensagem de boas-vindas do bot
      adicionarMensagemInicial(); 
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error(`Erro ao inicializar o agente ${CONFIG.agentName}:`, erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (Personalizada)
   * COMENT�RIO EDUCATIVO:
   * Esta fun��o insere a primeira mensagem do bot no chat.
   * O conte�do aqui � espec�fico do agente CBS e usa
   * HTML/Markdown (ex: <strong>, <ul>) para formata��o.
   */
  function adicionarMensagemInicial() {
    // Conte�do da mensagem de boas-vindas da CBS
    const mensagemInicial = `Ol�! Eu cuido das suas d�vidas sobre a <strong>CBS (Contribui��o sobre Bens e Servi�os)</strong>.
      <br><br>
      Posso orientar em:
      <ul>
        <li>Regras de cr�ditos e d�bitos (n�o cumulatividade);</li>
        <li>Al�quotas, base de c�lculo e fato gerador;</li>
        <li>Tratamento de receitas espec�ficas, exporta��es e benef�cios;</li>
        <li>Integração com a apura��o atual de PIS/COFINS durante a transição;</li>
        <li>Adequa��o de sistemas, NF-e e controles de compliance;</li>
        <li>Atualiza��o legislativa (Reforma Tributária).</li>
      </ul>
      Como posso te ajudar agora?`;

    adicionarMensagem('bot', mensagemInicial);
  }


  /**
   * 4. CONFIGURAR BOT�O DE FECHAR (Padr�o)
   * COMENT�RIO EDUCATIVO:
   * Encontra o bot�o de fechar (pelo atributo "data-close-chat")
   * e adiciona um "ouvinte de evento" (addEventListener) de clique.
   * Ao clicar, ele esconde o chat e chama "notificarFechamento".
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
      console.warn('Bot�o de fechar ou container do chat n�o encontrado.');
    }
  }

  /**
   * 5. LISTENERS CUSTOMIZADOS (Personalizado)
   * COMENT�RIO EDUCATIVO:
   * Adiciona melhorias de experi�ncia do utilizador (UX).
   * O "chatForm.addEventListener('submit', ...)" � o principal,
   * ele captura o envio da mensagem (clique ou Enter).
   * Tamb�m inclu�mos um trocador de "placeholder" autom�tico.
   */
  function adicionarListenersCustomizados() {
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
      evento.preventDefault();
      evento.stopPropagation(); 
      enviarMensagem(); // Chama a fun��o que processa o envio
    });

    // Placeholders rotativos espec�ficos da CBS
    const placeholders = [
      'Descreva sua d�vida sobre CBS...',
      'Qual a al�quota da CBS?',
      'Como funciona o cr�dito da CBS?',
      'E a transição do PIS/COFINS?'
    ];
    let placeholderIndex = 0;

    // L�gica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
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
    // quando uma nova mensagem � adicionada.
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * 6. CONFIGURAR AUTO-RESIZE (PADR�O)
   * COMENT�RIO EDUCATIVO:
   * Faz a caixa de texto (<textarea>) crescer e encolher
   * automaticamente conforme o utilizador digita,
   * at� um limite m�ximo (140px).
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      const novaAltura = Math.min(this.scrollHeight, 140); // Limite de 140px
      this.style.height = `${novaAltura}px`;
    });

    messageInput.addEventListener('blur', function () {
      if (this.value.trim() === '') {
        this.style.height = 'auto';
      }
    });
  }

  /**
   * 7. CONFIGURAR ATALHOS DE TECLADO (Padr�o)
   * COMENT�RIO EDUCATIVO:
   * Define o que "Enter" e "Shift+Enter" fazem.
   * - "Enter" (sem Shift): Envia o formul�rio.
   * - "Shift+Enter": Cria uma nova linha (comportamento padr�o).
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (evento) => {
      // Se pressionar Enter (sem Shift), previne a quebra de linha
      // e dispara o evento 'submit' do formul�rio.
      if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        document.getElementById('chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  /**
   * 8. ENVIAR MENSAGEM (L�GICA AUT�NOMA)
   * COMENT�RIO EDUCATIVO:
   * Fun��o chamada ao enviar o formul�rio.
   * 1. Pega o texto do input.
   * 2. Adiciona a mensagem do usu�rio na tela (com "adicionarMensagem").
   * 3. Limpa o input e desativa os bot�es (para evitar envios duplos).
   * 4. Mostra o indicador "digitando...".
   * 5. SIMULA uma chamada de API com "setTimeout".
   * 6. Recebe a resposta (de "gerarRespostaBot") e a exibe.
   * 7. Reativa os bot�es e o input.
   */
  function enviarMensagem() {
    if (enviandoMensagem || chatFechado) return;
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatWindow = document.getElementById('chat-window');

    if (!messageInput || !chatWindow || !sendButton) return;

    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      // Valida��o de campo vazio
      messageInput.style.borderColor = 'var(--color-danger)';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }
    
    // Bloqueia novos envios
    enviandoMensagem = true;
    messageInput.disabled = true;
    sendButton.disabled = true;

    // Adiciona a mensagem do usu�rio � tela
    adicionarMensagem('user', mensagem);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    // Mostra o "..."
    mostrarIndicadorDigitacao();

    // ================================================================
    // INTEGRA��O COM API (SIMULA��O)
    // COMENT�RIO EDUCATIVO:
    // Esta � a parte "simulada". "setTimeout" espera um
    // tempo aleat�rio (para parecer real) e ent�o chama
    // a fun��o "gerarRespostaBot" para obter uma resposta.
    // ================================================================
    setTimeout(() => {
      removerIndicadorDigitacao();
      const resposta = gerarRespostaBot(mensagem);
      adicionarMensagem('bot', resposta);
      
      // Libera o input para a pr�xima mensagem
      enviandoMensagem = false;
      if (!chatFechado) {
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.focus();
      }
    }, 1200 + Math.random() * 800); // Resposta em 1.2s a 2.0s
  }

  /**
   * 9. ADICIONAR MENSAGEM (CRIA��O DE HTML)
   * COMENT�RIO EDUCATIVO:
   * Fun��o que constr�i o HTML de uma nova mensagem
   * (avatar + bal�o) e a insere no chat.
   * Ela recebe o "tipo" ('bot' ou 'user') e o "conte�do" (o texto).
   * O �cone do avatar � definido aqui.
   */
  function adicionarMensagem(tipo, conteudo) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `chat-message ${tipo}`;

    // 1. Cria o Avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    // Define o �cone com base no tipo
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-diagram-project' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    // 2. Cria o Bal�o de Conte�do
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // 3. Processa o texto com "marked.js" para formatar
    if (typeof marked !== 'undefined') {
      try {
        // Converte Markdown (ex: **negrito**) para HTML (ex: <strong>negrito</strong>)
        bubbleDiv.innerHTML = marked.parse(conteudo);
      } catch(e) {
        bubbleDiv.textContent = conteudo; // Fallback se 'marked' falhar
      }
    } else {
      bubbleDiv.textContent = conteudo;
    }

    // 4. Junta as partes e adiciona � janela
    contentDiv.appendChild(bubbleDiv);
    mensagemDiv.appendChild(avatarDiv);
    mensagemDiv.appendChild(contentDiv);
    chatWindow.appendChild(mensagemDiv);
  }

  /**
   * 10. INDICADOR DE DIGITA��O (Padr�o)
   * COMENT�RIO EDUCATIVO:
   * Fun��es para mostrar e esconder o indicador "..." (digitando).
   * Elas criam e removem um elemento HTML com a anima��o de "pulse".
   * O �cone do bot � alterado aqui para o da CBS.
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    removerIndicadorDigitacao(); // Garante que s� haja um

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator'; // ID para f�cil remo��o

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-diagram-project'; // �cone CBS
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
   * 11. RESPOSTAS SIMULADAS (L�GICA DO BOT - Personalizada)
   * COMENT�RIO EDUCATIVO:
   * Esta � a "Intelig�ncia" (simulada) do bot.
   * A fun��o recebe a mensagem do usu�rio, converte para
   * min�sculas e procura por palavras-chave para
   * decidir qual resposta pr�-definida retornar.
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('al�quota') || texto.includes('aliquota') || texto.includes('quanto �')) {
      return `A al�quota geral da <strong>CBS</strong>, conforme a proposta da Reforma Tributária (PEC 45/2019 e Leis Complementares), est� sendo calibrada.
      
      **O que se espera:**
      <ul>
        <li>A al�quota padr�o do **IBS** (Estadual/Municipal) e da **CBS** (Federal) somadas deve girar em torno de **26,5% a 27%**.</li>
        <li>A CBS sozinha (substituindo PIS/COFINS) deve ficar em torno de **8,8% a 9%** (estimativa).</li>
      </ul>
      Haver� tamb�m al�quotas reduzidas (para sa�de, educa��o, etc.) e regimes espec�ficos (como o Simples Nacional).`;
    }

    if (texto.includes('cr�dito') || texto.includes('credito') || texto.includes('cumulatividade') || texto.includes('cumulativo')) {
      return `A regra geral da CBS � a **n�o cumulatividade plena**.
      
      **Como funciona:**
      <ol>
        <li>A empresa paga a CBS (ex: 9%) sobre **todas** as suas receitas.</li>
        <li>A empresa se apropria de cr�dito (ex: 9%) sobre **todas** as suas aquisi��es (insumos, custos, despesas, e at� ativo imobilizado), desde que sejam para a atividade da empresa.</li>
        <li>O valor a pagar � o **D�bito (sa�das) - Cr�dito (entradas)**.</li>
      </ol>
      Isso elimina a complexidade atual do PIS/COFINS (regimes cumulativo vs. n�o cumulativo) e o conceito restrito de "insumo".`;
    }

    if (texto.includes('transição') || texto.includes('transicao') || texto.includes('pis') || texto.includes('cofins')) {
      return `A transição do PIS/COFINS para a CBS ser� um per�odo de conviv�ncia entre os dois sistemas.
      
      **O plano atual �:**
      <ul>
        <li>**2026:** In�cio de um "teste" com a CBS a 0,9% e o PIS/COFINS a 0%.</li>
        <li>**2027:** A CBS entra em vigor com sua al�quota cheia (ex: 9%) e o PIS/COFINS s�o **extintos** (zerados).</li>
      </ul>
      Para o PIS/COFINS, a transição � mais r�pida do que a do ICMS/IPI (que levar� anos). A maior complexidade ser� o tratamento dos saldos credores de PIS/COFINS acumulados at� 2026.`;
    }

    // Resposta Padr�o (Fallback)
    // Se nenhuma palavra-chave for encontrada, ele repete a mensagem inicial.
    return `Sou o especialista na <strong>CBS (Contribui��o sobre Bens e Servi�os)</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Regras de cr�ditos e d�bitos (n�o cumulatividade);</li>
        <li>Al�quotas, base de c�lculo e fato gerador;</li>
        <li>Integração com a apura��o atual de PIS/COFINS durante a transição;</li>
        <li>Atualiza��o legislativa (Reforma Tributária).</li>
      </ul>
      Qual assunto voc� deseja aprofundar?`;
  }

  /**
   * 12. MOSTRAR ERRO (Fallback - Personalizado)
   * COMENT�RIO EDUCATIVO:
   * Fun��o de seguran�a caso a inicializa��o falhe.
   * Ela exibe uma mensagem de erro formatada dentro do chat.
   */
  function mostrarErroNoChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const erroDiv = document.createElement('div');
    erroDiv.className = 'chat-message bot';
    // Mensagem de erro personalizada para a CBS
    erroDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble" style="background: #FFFFFF; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06); border-color: #7AC143; color: #0F0F0F;">
          <strong>?? Erro ao iniciar o agente CBS</strong><br><br>
          N�o foi poss�vel carregar a interface no momento. Recarregue a p�gina ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  /**
   * 13. INICIALIZA��O
   * COMENT�RIO EDUCATIVO:
   * Este � o "gatilho" que inicia tudo.
   * Ele espera o HTML da p�gina estar completamente carregado
   * (evento "DOMContentLoaded") antes de chamar a "iniciarChat".
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    // Se o DOM j� carregou, inicia imediatamente
    // (usamos um pequeno 'setTimeout' para garantir
    // que a renderiza��o inicial terminou)
    setTimeout(iniciarChat, 100);
  }
})();