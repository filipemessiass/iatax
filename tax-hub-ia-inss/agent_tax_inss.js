/**
 * ============================================
 * AGENT TAX CONSULT INSS - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com valida��es
 * (Vers�o Padronizada e Aut�noma)
 * ============================================
 */

(() => {
  // 1. CONFIGURA��O DO AGENTE
  // Define as informa��es b�sicas deste agente
  const CONFIG = {
    agentId: 'inss', 
    agentName: 'Agente Tax - Consultor INSS',
    apiContext: 'INSS',
    // AJUSTE DE TEXTO: Corrigido e padronizado
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre INSS, selecione novamente o agente.'
  };

  let chatFechado = false;
  let enviandoMensagem = false; // Controla se uma resposta da API est� pendente

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
        console.warn('N�o foi poss�vel restaurar o conte�do inicial:', erro);
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
        console.warn('N�o foi poss�vel enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  /**
   * 3. INICIALIZA��O DO CHAT (PADRONIZADO)
   * A fun��o principal que � chamada quando o agente � carregado.
   */
  function iniciarChat() {
    configurarBotaoFechar();
    
    // AJUSTE DE L�GICA: Removemos a depend�ncia do 'initializeAgentChat'
    try {
      adicionarListenersCustomizados();
      configurarAutoResize();
      configurarAtalhosTeclado();
      adicionarMensagemInicial(); // Adiciona a mensagem de boas-vindas
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error('Erro ao inicializar o agente INSS:', erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (PADR�O)
   * Adiciona a mensagem de boas-vindas do bot quando o chat � iniciado.
   */
  function adicionarMensagemInicial() {
    // AJUSTE DE TEXTO: Texto movido do HTML e corrigido para UTF-8
    const mensagemInicial = `Ol�! Sou o assistente focado no <strong>INSS</strong> empresarial.
      <br><br>
      Posso orientar em:
      <ul>
        <li>Apura��o da contribui��o patronal, RAT e terceiros;</li>
        <li>Compensa��es, restitui��es e PER/DCOMP Web;</li>
        <li>Revis�o de tributa��o sobre folha, FAP e eSocial;</li>
        <li>Processos administrativos junto � Receita Federal e INSS;</li>
        <li>Obrigações acess�rias: DCTFWeb, eSocial, EFD-Reinf.</li>
      </ul>
      Qual assunto deseja tratar primeiro?`;

    adicionarMensagem('bot', mensagemInicial);
  }


  /**
   * 4. CONFIGURAR BOT�O DE FECHAR
   * Encontra o bot�o no HTML e adiciona o evento de clique.
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
   * 5. LISTENERS CUSTOMIZADOS
   * Adiciona melhorias de experi�ncia do utilizador (UX).
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
      enviarMensagem();
    });

    // AJUSTE DE TEXTO: Placeholders corrigidos para UTF-8
    const placeholders = [
      'Descreva sua d�vida sobre INSS...',
      'Como funciona a reten��o de 11%?',
      'O que � o FAP e como revisar?',
      'Como funciona o PER/DCOMP Web?'
    ];
    let placeholderIndex = 0;

    // L�gica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5000);

    // Efeito de "zoom" no bot�o de enviar ao digitar (Padr�o IRPJ)
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

      // Altura m�nima padronizada (IRPJ)
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
        if (confirm('Deseja limpar o hist�rico da conversa?')) {
          limparChat();
        }
      }
    });
  }

  /**
   * 8. ENVIAR MENSAGEM (L�GICA AUT�NOMA)
   * Fun��o chamada ao enviar o formul�rio.
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
    // INTEGRA��O COM API (SIMULA��O)
    // ================================================================
    // Este agente est� a usar uma simula��o (setTimeout).
    // Para ligar � API real, substitua este bloco 'setTimeout'
    // pela l�gica 'try/catch/fetch' do ficheiro 'agent_tax_irpj.js'.
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
   * 9. ADICIONAR MENSAGEM (CRIA��O DE HTML)
   * Fun��o que constr�i o HTML de uma nova mensagem e a insere no chat.
   */
  function adicionarMensagem(tipo, conteudo) {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = `chat-message ${tipo}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    // Define o �cone com base no tipo
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-user-shield' : 'fa-solid fa-user';
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
   * 10. INDICADOR DE DIGITA��O
   * Fun��es para mostrar e esconder o "..."
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
    avatarIcon.className = 'fa-solid fa-user-shield';
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
   * 11. RESPOSTAS SIMULADAS (L�GICA DO BOT)
   * AJUSTE DE TEXTO: Respostas criadas para INSS.
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('rat') || texto.includes('fap')) {
      return `O **RAT (Risco Ambiental do Trabalho)** � uma contribui��o de 1%, 2% ou 3% sobre a folha, dependendo do risco da atividade principal da empresa (CNAE).
      <br><br>
      O **FAP (Fator Acident�rio de Preven��o)** � um multiplicador (de 0,5 a 2,0) que ajusta o RAT. Se a empresa tem baixa acidentalidade, o FAP diminui o RAT (ex: 3% * 0,5 = 1,5%). Se tem alta acidentalidade, o FAP aumenta o RAT (ex: 3% * 2,0 = 6%).
      <br><br>
      Revisar o FAP anualmente � crucial para reduzir custos.`;
    }

    if (texto.includes('dctfweb') || texto.includes('reinf') || texto.includes('esocial')) {
      return `O **eSocial**, **EFD-Reinf** e **DCTFWeb** s�o os pilares da apura��o do INSS:
      
      <ul>
        <li><strong>eSocial:</strong> Informa todos os dados da folha de pagamento (sal�rios, f�rias, rescis�es). � onde se calcula o INSS dos funcion�rios e o INSS Patronal sobre a folha.</li>
        <li><strong>EFD-Reinf:</strong> Informa as reten��es de INSS sobre servi�os tomados (cess�o de m�o de obra) e outras informa��es (ex: CPRB, patroc�nio esportivo).</li>
        <li><strong>DCTFWeb:</strong> � a "conta corrente". Ela recebe os d�bitos do eSocial e da Reinf, e tamb�m os cr�ditos (ex: sal�rio-fam�lia), gerando a guia �nica (DARF) para pagamento.</li>
      </ul>`;
    }

    if (texto.includes('per/dcomp') || texto.includes('compensa��o') || texto.includes('restitui��o')) {
      return `O **PER/DCOMP Web** � o sistema da Receita Federal usado para reaver cr�ditos previdenci�rios (INSS) pagos a maior ou indevidamente.
      
      **Quando usar:**
      <ul>
        <li>**Restitui��o:** Para pedir o dinheiro de volta em conta corrente.</li>
        <li>**Compensa��o:** Para usar o cr�dito e "quitar" d�bitos futuros de INSS (ou outros tributos federais) na DCTFWeb.</li>
      </ul>
      � comum usar o PER/DCOMP Web para reaver cr�ditos de reten��o de INSS (11%) maiores que o devido, ou para revisar verbas indenizat�rias (ex: aviso pr�vio) que foram tributadas indevidamente.`;
    }

    // Resposta Padr�o (corrigida)
    return `Sou o assistente focado no <strong>INSS</strong> empresarial.
      <br><br>
      Posso orientar em:
      <ul>
        <li>Apura��o da contribui��o patronal, RAT e terceiros;</li>
        <li>Compensa��es, restitui��es e PER/DCOMP Web;</li>
        <li>Revis�o de tributa��o sobre folha, FAP e eSocial;</li>
        <li>Processos administrativos junto � Receita Federal e INSS;</li>
        <li>Obrigações acess�rias: DCTFWeb, eSocial, EFD-Reinf.</li>
      </ul>
      Qual assunto deseja tratar primeiro?`;
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
   * Fun��o de seguran�a caso a inicializa��o falhe.
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
          <strong>?? Erro ao iniciar o agente INSS</strong><br><br>
          N�o foi poss�vel carregar a interface no momento. Recarregue a p�gina ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  /**
   * 14. INICIALIZA��O
   * Dispara a fun��o 'iniciarChat' quando o DOM estiver pronto.
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    setTimeout(iniciarChat, 100);
  }
})();