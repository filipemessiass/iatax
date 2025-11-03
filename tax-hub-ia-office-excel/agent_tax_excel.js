/**
 * ============================================================
 * AGENTE EXCEL - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com valida��es
 * (Vers�o Padronizada e Aut�noma)
 *
 * Comentários Educativos:
 * Este ficheiro � o "c�rebro" do agente. Ele � "aut�nomo",
 * o que significa que cont�m toda a l�gica necess�ria
 * para o chat funcionar (enviar, receber, simular respostas)
 * sem depender de um script externo.
 * =ENTRY POINT: A fun��o 'iniciarChat' (no final) � o ponto de partida.
 * ============================================================
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
    agentId: 'excel',
    agentName: 'Agente Tax - Consultor Excel',
    apiContext: 'PACOTE_OFFICE_EXCEL',
    // Mensagem usada ao fechar
    closingMessage:
      'Conversa encerrada. Sempre que quiser retomar um estudo sobre Excel, abra novamente este agente.'
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
   */
  function adicionarMensagemInicial() {
    const mensagemInicial = `Ol�! Sou o **consultor especializado em Excel** aqui no TaxHub IA.
      <br><br>
      Posso ajudar voc� com:
      <ul>
        <li>Modelagem de planilhas financeiras e fiscais</li>
        <li>Uso avan�ado de tabelas din�micas e Power Query</li>
        <li>Compara��o de fun��es de busca (PROCV, PROCX, XLOOKUP)</li>
        <li>Boas pr�ticas de automa��o com macros e VBA</li>
        <li>Cria��o de dashboards com Power Pivot e gr�ficos interativos</li>
      </ul>
      Qual desafio com Excel voc� quer resolver agora?`;

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

    // *** CONTE�DO ADAPTADO PARA EXCEL ***
    const placeholders = [
      'Como construir uma tabela din�mica eficiente?',
      'Qual f�rmula usar para buscar dados (PROCV ou XLOOKUP)?',
      'Como montar um dashboard interativo?',
      'De que maneira o Power Query ajuda na automa��o?'
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
      // Sombra espec�fica do tema Excel (verde)
      sendButton.style.boxShadow = possuiTexto
        ? '0 14px 32px rgba(122, 193, 67, 0.4)'
        : '0 10px 26px rgba(122, 193, 67, 0.28)';
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
    
    // *** �CONE ADAPTADO PARA EXCEL ***
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-table-cells-large' : 'fa-solid fa-user';
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
    avatarIcon.className = 'fa-solid fa-table-cells-large'; // �cone do Excel
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
   * uma resposta pr�-definida baseada nos t�picos do Excel.
   *
   * @param {string} mensagem - O texto enviado pelo utilizador.
   * @returns {string} - A resposta do bot (texto).
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('tabela dinam') || texto.includes('pivot')) {
      return `**Tabelas Din�micas** s�o ideais para resumir grandes volumes de dados.

**Passos essenciais:**
1. Estruture os dados em formato tabular, sem linhas em branco.
2. Use *Inserir > Tabela Din�mica* e selecione "Adicionar ao Modelo de Dados" se precisar de relacionamentos.
3. Organize campos em Linhas, Colunas, Valores e Filtros.
4. Ative *Segmenta��o de Dados* para filtros intuitivos e *Cronologia* para datas.

Se voc� precisa consolidar v�rias fontes, combine-as primeiro com Power Query antes de atualizar a tabela din�mica.`;
    }

    if (texto.includes('procv') || texto.includes('vlookup') || texto.includes('xlookup') || texto.includes('procx')) {
      return `Para **buscar valores** existem tr�s abordagens principais:

<ul>
  <li><strong>PROCV (VLOOKUP):</strong> Cl�ssico, mas limitado a procurar apenas para a direita.</li>
  <li><strong>PROCX (XLOOKUP):</strong> O substituto moderno (Microsoft 365). Aceita busca em qualquer dire��o e trata erros nativamente.</li>
  <li><strong>�NDICE + CORRESP:</strong> A combina��o mais flex�vel e com melhor performance, ideal para planilhas muito grandes.</li>
</ul>

**Boa pr�tica:** Prefira **PROCX (XLOOKUP)** sempre que poss�vel. � mais f�cil de ler e muito mais poderoso que o PROCV.`;
    }

    if (texto.includes('power query') || texto.includes('consulta') || texto.includes('etl')) {
      return `O **Power Query** (Editor de Consultas) � a melhor ferramenta para automatizar a importa��o e limpeza de dados (ETL).

**Fluxo sugerido:**
1. *Dados > Obter Dados* e selecione a fonte (Excel, CSV, web, banco de dados).
2. Na interface do Power Query, aplique etapas: remover colunas, separar texto, mesclar consultas, etc.
3. Cada clique gera uma etapa de tratamento no painel "Etapas Aplicadas".
4. Carregue o resultado para uma Tabela ou para o "Modelo de Dados" (Power Pivot).

**Vantagem principal:** Ao receber um novo arquivo (ex: o extrato do pr�ximo m�s), basta coloc�-lo na pasta e clicar em **Atualizar Tudo**. O Power Query refaz todas as etapas de limpeza automaticamente.`;
    }

    if (texto.includes('macro') || texto.includes('vba')) {
      return `Para **automatizar com macros (VBA)**:

1. Ative a guia *Desenvolvedor* (Arquivo > Op��es > Personalizar Faixa de Op��es).
2. Use o **Gravador de Macros** para tarefas repetitivas (ex: formatar um relat�rio).
3. Estude o c�digo VBA gerado (Alt+F11) para adicionar l�gicas, loops (For/Next) e condi��es (If/Then).
4. Organize o c�digo em m�dulos e trate erros com \`On Error Resume Next\`.

**Cuidado:** Macros s�o poderosas, mas podem ser complexas de manter. Para simples importa��o de dados, prefira sempre o Power Query.`;
    }

    if (texto.includes('dashboard') || texto.includes('power pivot') || texto.includes('gr�fico')) {
      return `Para um **Dashboard executivo em Excel**:

1. **Centralize os dados:** Use o **Power Query** para importar e limpar as fontes (ex: CSV, SQL, outras planilhas).
2. **Modele os dados:** Carregue os dados para o **Power Pivot**. Crie relacionamentos entre tabelas (ex: Tabela Fato-Vendas e Tabela Dimens�o-Calend�rio).
3. **Crie Medidas (DAX):** Em vez de f�rmulas na planilha, crie medidas no Power Pivot (ex: \`Receita YTD := TOTALYTD(SUM(Fato[Receita]); dCalendario[Data])\`).
4. **Visualize:** Crie Tabelas Din�micas e Gr�ficos Din�micos baseados no Modelo de Dados. Adicione Segmenta��o de Dados para filtros interativos.
5. **Apresente:** Agrupe tudo numa aba limpa, proteja a estrutura e oculte as abas de dados.`;
    }

    // Resposta Padr�o (Fallback)
    // Se o bot n�o entender, ele se apresenta novamente.
    return `Obrigado pela mensagem! Como especialista em **Excel profissional**, posso apoiar voc� em:
<ul>
  <li>Organiza��o de bases fiscais e cont�beis</li>
  <li>Uso de fun��es financeiras (VPL, TIR, PGTO, VF)</li>
  <li>Tratamento de dados com Power Query e Power Pivot</li>
  <li>Cria��o de modelos or�ament�rios din�micos</li>
  <li>Estrutura��o de planilhas colaborativas com controle de erros</li>
</ul>
Fique � vontade para detalhar o contexto da sua planilha que eu aprofundo a orientação.`;
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
          <strong>?? Erro ao iniciar o agente Excel</strong><br><br>
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