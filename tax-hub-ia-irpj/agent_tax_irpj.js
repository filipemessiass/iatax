/**
 * ============================================
 * AGENTE TAX CONSULT IRPJ/CSLL - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * (Versão Padronizada e Autónoma)
 *
 * COMENTÁRIO DA MUDAN�?A:
 * Este script foi modificado para se conectar
 * à API real (http://localhost:5000/api/chat)
 * em vez de usar respostas simuladas.
 * As principais alterações estão na SE�?�fO 8.
 * ============================================
 */

// Usamos uma "IIFE" (Immediately Invoked Function Expression)
// (function() { ... })();
// Isso cria um "âmbito" (scope) privado, protegendo 
// as nossas variáveis (como 'chatFechado') de conflitos
// com outros scripts na página.
(() => {
  /**
   * SE�?�fO 1: CONFIGURA�?�fO DO AGENTE
   * Define as constantes e variáveis globais para este agente.
   */
  const CONFIG = {
    agentId: 'irpj',
    agentName: 'Agente Tax - Consultor IRPJ e CSLL',
    apiContext: 'IRPJ_CSLL', // <-- MUDAN�?A: Contexto para enviar à API
    apiUrl: 'http://localhost:5000/api/chat', // <-- MUDAN�?A: Endpoint da API
    closingMessage:
      'Conversa encerrada. Para um novo atendimento sobre IRPJ/CSLL, selecione novamente o agente.'
  };

  // Variáveis de "estado" (controlam o estado atual do chat)
  let chatFechado = false;
  let enviandoMensagem = false; // Impede o utilizador de enviar 2+ mensagens ao mesmo tempo

  /**
   * SE�?�fO 2: NOTIFICAR FECHAMENTO (Função Padrão)
   * Avisa o 'menu principal' (a página que carregou o agente)
   * que este chat foi fechado pelo utilizador.
   */
  function notificarFechamento() {
    if (chatFechado) {
      return;
    }
    chatFechado = true;
    const detalhe = { agentId: CONFIG.agentId, agentName: CONFIG.agentName };

    // Tenta chamar a função global de restauração (se existir)
    if (typeof window.restaurarConteudoInicial === 'function') {
      try {
        window.restaurarConteudoInicial();
      } catch (erro) {
        console.warn('Não foi possível restaurar o conteúdo inicial:', erro);
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
        console.warn('Não foi possível enviar mensagem de fechamento ao parent:', erroPostMessage);
      }
    }
  }

  /**
   * SE�?�fO 3: INICIALIZA�?�fO DO CHAT (Função Principal)
   * Chamada quando o script é carregado. 
   * Configura todos os "ouvintes" (event listeners).
   */
  function iniciarChat() {
    // 1. Configura o botão de fechar
    configurarBotaoFechar();
    
    // 2. Tenta configurar o resto
    try {
      adicionarListenersCustomizados(); // Placeholders, etc.
      configurarAutoResize(); // Textarea crescer
      configurarAtalhosTeclado(); // Enviar com Enter
      adicionarMensagemInicial(); // Adiciona o "Olá!" do bot
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error(`Erro ao inicializar o agente ${CONFIG.agentName}:`, erro);
      mostrarErroNoChat(); // Mostra um erro DENTRO do chat
    }
  }
  
  /**
   * SE�?�fO 3.1: ADICIONAR MENSAGEM INICIAL
   * Injeta a primeira mensagem do bot na janela de chat.
   */
  function adicionarMensagemInicial() {
    const mensagemInicial = `Olá! Eu sou o seu assistente fiscal especializado em <strong>IRPJ</strong> (Imposto de Renda Pessoa Jurídica).
      <br><br>
      Posso ajudá-lo com:
      <ul>
        <li>Cálculos e apuração do IRPJ e CSLL</li>
        <li>Regimes de tributação (Lucro Real, Presumido, Arbitrado)</li>
        <li>Incentivos fiscais e deduções</li>
        <li>Legislação tributária federal</li>
        <li>Planejamento tributário</li>
      </ul>
      Como posso ajudar você hoje?`;

    adicionarMensagem('bot', mensagemInicial);
  }


  /**
   * SE�?�fO 4: CONFIGURAR BOT�fO DE FECHAR
   * Encontra o botão (data-close-chat) no HTML e adiciona o 
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
      console.warn('Botão de fechar ou container do chat não encontrado.');
    }
  }

  /**
   * SE�?�fO 5: LISTENERS CUSTOMIZADOS (UX)
   * Adiciona melhorias de experiência do utilizador, como os 
   * placeholders rotativos na caixa de texto.
   */
  function adicionarListenersCustomizados() {
    // Seleciona os elementos do DOM (HTML)
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
      evento.preventDefault(); // Impede o recarregamento da página
      evento.stopPropagation(); 
      enviarMensagem(); // Chama a nossa função de envio
    });

    // *** CONTE�sDO ADAPTADO PARA IRPJ ***
    const placeholders = [
      'Descreva sua dúvida sobre IRPJ ou CSLL...',
      'Quais são as principais adições ao LALUR?',
      'Como funciona a compensação de prejuízo fiscal?',
      'Diferença entre Lucro Real Trimestral e Anual?'
    ];
    let placeholderIndex = 0;

    // Lógica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      // Só troca se o utilizador não estiver a digitar
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5000);

    // Efeito de "zoom" no botão de enviar ao digitar (Padrão)
    messageInput.addEventListener('input', () => {
      const possuiTexto = messageInput.value.trim().length > 0;
      sendButton.style.transform = possuiTexto ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = possuiTexto
        ? '0 12px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 24px rgba(0, 0, 0, 0.3)';
    });

    // Observador para rolar o chat para baixo automaticamente
    // sempre que uma nova mensagem (child) é adicionada
    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * SE�?�fO 6: CONFIGURAR AUTO-RESIZE (Função Padrão)
   * Faz a 'textarea' crescer e encolher verticalmente 
   * conforme o utilizador digita (até um limite).
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
   * SE�?�fO 7: CONFIGURAR ATALHOS DE TECLADO (Função Padrão)
   * Define o que "Enter" (envia) e "Shift+Enter" (nova linha) fazem.
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (evento) => {
      // Enter (sem Shift) envia o formulário
      if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        document.getElementById('chat-form').dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
  }

  /**
   * SE�?�fO 8: ENVIAR MENSAGEM (L�"GICA AUT�"NOMA)
   * Função principal do fluxo:
   * 1. Pega a mensagem do utilizador.
   * 2. Adiciona o balão do utilizador.
   * 3. Mostra o indicador "a digitar...".
   * 4. CHAMA A API REAL (fetch).
   * 5. Adiciona a resposta do bot (vinda da API).
   * * <-- MUDAN�?A: A função agora é 'async' para usar 'await'
   */
  async function enviarMensagem() {
    // Bloqueia envios duplicados
    if (enviandoMensagem || chatFechado) return;
    
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    if (!messageInput || !sendButton) return;

    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      // Validação de campo vazio
      messageInput.style.borderColor = 'var(--color-danger)';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }
    
    // ----- Início do Envio -----
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
    // SE�?�fO 8.1: INTEGRA�?�fO COM API (L�"GICA REAL)
    // <-- MUDAN�?A: O 'setTimeout' e 'gerarRespostaBot' foram removidos
    // e substituídos por este bloco 'try...catch...finally'.
    // ================================================================
    
    // Usamos "simples" como padrão, conforme seu exemplo. 
    // Você pode ajustar para "padrao" ou "rapida" se necessário.
    const taskType = "simples";

    try {
      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          prompt: mensagem,
          task_type: taskType,
          agent_context: CONFIG.apiContext // Enviando o contexto do agente
        })
      });

      // Remove o "..." assim que a resposta (mesmo de erro) chegar
      removerIndicadorDigitacao();

      if (!response.ok) {
        // Se o servidor retornar um erro (ex: 500 Internal Server Error)
        const errorData = await response.json().catch(() => ({})); // Tenta ler o JSON do erro
        const errorMsg = errorData.error || 'Ocorreu um erro no servidor.';
        console.error('Erro da API:', response.status, errorData);
        adicionarMensagem('bot', `�s�️ **Erro ${response.status}:** ${errorMsg}<br>Por favor, tente novamente.`);
        return; // Sai da função, mas o 'finally' abaixo irá reativar o input
      }

      // 4. Pega a resposta da API
      const data = await response.json();

      // 5. Adiciona a resposta do bot (vinda de data.reply)
      if (data.reply) {
        adicionarMensagem('bot', data.reply);
        
        // Loga os metadados (ex: agente usado) no console, se existirem
        if (data.metadata && data.metadata.agent_used) {
          console.log('Agente usado (info do backend):', data.metadata.agent_used);
        }
      } else {
        adicionarMensagem('bot', 'Recebi uma resposta vazia do servidor. Por favor, tente reformular a pergunta.');
      }

    } catch (error) {
      console.error('Erro de rede ou ao conectar com a API:', error);
      removerIndicadorDigitacao(); // Garante que remove o "..."
      
      // 6. Adiciona uma mensagem de ERRO DE CONEX�fO no chat
      adicionarMensagem('bot', `�s�️ **Erro de Conexão**
        <br><br>
        Não foi possível conectar ao assistente de IA no momento. 
        <br>
        Por favor, verifique se o servidor local (<b>${CONFIG.apiUrl}</b>) está em execução e tente novamente.`);
    } finally {
      // ----- Fim do Envio (Sempre executa) -----
      // <-- MUDAN�?A: Este bloco agora está dentro de 'finally'
      // para garantir que o chat seja reativado mesmo se a API falhar.
      enviandoMensagem = false;
      if (!chatFechado) {
          messageInput.disabled = false;
          sendButton.disabled = false;
          messageInput.focus();
      }
    }
  }


  /**
   * SE�?�fO 9: ADICIONAR MENSAGEM (CRIA�?�fO DE HTML)
   * Função "construtora" que cria o HTML de um novo balão 
   * de chat (avatar + balão) e o insere na janela.
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
    
    // *** ÍCONE ADAPTADO PARA IRPJ ***
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-building-columns' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    // 3. Cria o conteúdo (balão)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    // 4. Processa o texto com 'marked' (converte Markdown para HTML)
    // <-- MUDAN�?A: Adicionado um 'try...catch' mais robusto
    try {
      if (typeof marked !== 'undefined') {
        bubbleDiv.innerHTML = marked.parse(conteudo);
      } else {
        // Fallback se 'marked' não carregou: usa <pre> para manter quebras de linha
        bubbleDiv.innerHTML = conteudo.replace(/\n/g, '<br>');
      }
    } catch (e) {
      console.error('Erro ao processar Markdown:', e);
      bubbleDiv.textContent = conteudo; // Fallback seguro
    }

    // 5. Monta a estrutura e adiciona à janela
    contentDiv.appendChild(bubbleDiv);
    mensagemDiv.appendChild(avatarDiv);
    mensagemDiv.appendChild(contentDiv);
    chatWindow.appendChild(mensagemDiv);
  }

  /**
   * SE�?�fO 10: INDICADOR DE DIGITA�?�fO (Funções Padrão)
   * Funções que criam e removem o balão "..." (loading).
   */
  function mostrarIndicadorDigitacao() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    removerIndicadorDigitacao(); // Garante que só existe um

    // Cria o HTML do indicador (similar à Seção 9)
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chat-message bot loading';
    loadingDiv.id = 'typing-indicator'; // ID para o removermos facilmente

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    const avatarIcon = document.createElement('i');
    avatarIcon.className = 'fa-solid fa-building-columns'; // Ícone do IRPJ
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
   * SE�?�fO 11: RESPOSTAS SIMULADAS (L�"GICA DO BOT)
   * *** ESTA �? A INTELIG�SNCIA SIMULADA DO AGENTE ***
   *
   * <-- NOTA: Esta função 'gerarRespostaBot' não é mais
   * chamada pela 'enviarMensagem'. Ela permanece aqui
   * apenas como referência da lógica antiga.
   *
   * @param {string} mensagem - O texto enviado pelo utilizador.
   * @returns {string} - A resposta do bot (texto).
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    // Tópico 1: Lucro Real vs Presumido
    if (texto.includes('real') || texto.includes('presumido') || texto.includes('regime')) {
      return `A principal diferença entre **Lucro Real** e **Lucro Presumido** é a base de cálculo:
      
      <ul>
        <li><strong>Lucro Real:</strong> A apuração do IRPJ (15%) e CSLL (9%) é baseada no **lucro contábil real** (Receitas - Custos - Despesas), ajustado no LALUR (Livro de Apuração do Lucro Real) por adições e exclusões. �? obrigatório para empresas com faturamento > R$ 78 milhões/ano.</li>
        <li><strong>Lucro Presumido:</strong> A apuração é simplificada. Aplica-se um percentual de presunção de lucro (ex: 8% para IRPJ, 12% para CSLL sobre a receita bruta) e calcula-se o imposto sobre esse lucro presumido.</li>
      </ul>`;
    }

    // Tópico 2: LALUR / Adições / Exclusões
    if (texto.includes('lalur') || texto.includes('adições') || texto.includes('exclusões')) {
      return `O **LALUR** (agora digital na ECF) é onde ajustamos o lucro contábil para chegar ao lucro fiscal.
      
      **Exemplos comuns:**
      <ul>
        <li><strong>Adições (Aumentam o imposto):</strong> Multas não dedutíveis, despesas com brindes, provisões não realizadas.</li>
        <li><strong>Exclusões (Diminuem o imposto):</strong> Receita de equivalência patrimonial positiva, Juros Sobre Capital Próprio (JCP) recebidos (se já tributados na fonte).</li>
      </ul>`;
    }

    // Tópico 3: Prejuízo Fiscal
    if (texto.includes('prejuízo') || texto.includes('compensação')) {
      return `Se a empresa apurar **Prejuízo Fiscal** (LALUR negativo) no Lucro Real, ela não paga IRPJ/CSLL naquele período.
      
      **Regras de Compensação:**
      <ol>
        <li>Esse prejuízo pode ser usado para abater lucros futuros.</li>
        <li>A compensação é limitada a **30% do lucro real** do período em que você está compensando.</li>
        <li>Não há prazo (prescrição) para usar esse prejuízo, desde que a empresa mantenha a escrituração (Parte B do LALUR) correta.</li>
      </ol>`;
    }

    // Resposta Padrão (Fallback)
    // Se o bot não entender, ele se apresenta novamente.
    return `Sou o assistente de <strong>IRPJ e CSLL</strong>.
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Cálculos e apuração (Lucro Real, Presumido);</li>
        <li>Regras do LALUR (Adições e Exclusões);</li>
        <li>Compensação de prejuízos fiscais;</li>
        <li>Legislação e planejamento tributário.</li>
      </ul>
      Poderia reformular sua pergunta sobre um destes tópicos?`;
  }


  /**
   * SE�?�fO 12: LIMPAR CHAT (Função Padrão)
   * Remove todas as mensagens da janela de chat, exceto 
   * a primeira (índice 0), que é a de boas-vindas.
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
   * SE�?�fO 13: MOSTRAR ERRO (Fallback)
   * Função de segurança caso a 'iniciarChat' (Seção 3) falhe.
   * Mostra uma mensagem de erro amigável dentro do chat.
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
          <strong>�s�️ Erro ao iniciar o agente IRPJ/CSLL</strong><br><br>
          Não foi possível carregar a interface no momento. Recarregue a página ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  /**
   * SE�?�fO 14: INICIALIZA�?�fO (ENTRY POINT)
   * Este é o código que "liga" o agente.
   * Ele espera o HTML estar pronto ('DOMContentLoaded') 
   * e então chama a nossa função 'iniciarChat' (Seção 3).
   */
  if (document.readyState === 'loading') {
    // Se o script carregar antes do HTML, espera
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    // Se o HTML já estiver pronto, inicia (com um pequeno delay)
    setTimeout(iniciarChat, 100);
  }
})();