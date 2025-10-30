/**
 * ============================================
 * AGENT TAX CONSULT LEI DO BEM - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * ============================================
 */

(() => {
  const CONFIG = {
    agentId: 'ldb',
    agentName: 'Agente Tax Consultor Lei do Bem (P&D)',
    apiContext: 'LEI_DO_BEM',
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre Lei do Bem, selecione novamente o agente.'
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
    configurarBotaoFechar();

    if (typeof initializeAgentChat !== 'function') {
      console.error('initializeAgentChat não está disponível para o agente Lei do Bem.');
      mostrarErroNoChat();
      return;
    }

    try {
      initializeAgentChat(CONFIG);
      adicionarListenersCustomizados();
      configurarAutoResize();
      configurarAtalhosTeclado();
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error('Erro ao inicializar o agente Lei do Bem:', erro);
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
   * Adiciona listeners customizados
   */
  function adicionarListenersCustomizados() {
    const chatWindow = document.getElementById('chat-window');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatForm = document.getElementById('chat-form');
    const closeButton = document.querySelector('.close-chat-button');
    const chatContainer = document.getElementById('chat-container');

    if (!chatWindow || !messageInput || !sendButton || !chatForm) {
      console.warn('Elementos essenciais do chat não encontrados.');
      return;
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (chatContainer) {
          chatContainer.style.display = 'none';
          chatContainer.classList.add('chat-closed');
          notificarFechamento();
        }
      });
    }

    chatForm.addEventListener('submit', (evento) => {
      evento.preventDefault();
      enviarMensagem();
    });

    const placeholders = [
      'Escreva sua pergunta sobre Lei do Bem...',
      'Como calcular o benefício fiscal?',
      'Quais despesas podem ser enquadradas?',
      'Quais documentos preciso manter?',
      'Como funciona a prestação de contas ao MCTI?'
    ];
    let placeholderIndex = 0;

    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        messageInput.placeholder = `${placeholders[placeholderIndex]} (Shift+Enter para nova linha)`;
      }
    }, 5000);

    messageInput.addEventListener('input', () => {
      const possuiTexto = messageInput.value.trim().length > 0;
      sendButton.style.transform = possuiTexto ? 'scale(1.05)' : 'scale(1)';
      sendButton.style.boxShadow = possuiTexto
        ? '0 12px 32px rgba(1, 43, 102, 0.45)'
        : '0 8px 24px rgba(1, 43, 102, 0.3)';
    });

    const observador = new MutationObserver(() => {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    });
    observador.observe(chatWindow, { childList: true, subtree: true });
  }

  /**
   * Configura auto-resize do textarea
   */
  function configurarAutoResize() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('input', function () {
      this.style.height = 'auto';
      const novaAltura = Math.min(this.scrollHeight, 150);
      this.style.height = `${novaAltura}px`;

      const alturaMinima = window.innerWidth < 480 ? 46 : window.innerWidth < 768 ? 52 : 56;
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
   * Configura atalhos de teclado
   */
  function configurarAtalhosTeclado() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;

    messageInput.addEventListener('keydown', (evento) => {
      if (evento.key === 'Enter' && !evento.shiftKey) {
        evento.preventDefault();
        enviarMensagem();
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
   * Envia mensagem do usuário
   */
  function enviarMensagem() {
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');

    if (!messageInput || !chatWindow) return;

    const mensagem = messageInput.value.trim();
    if (mensagem === '') {
      messageInput.style.borderColor = '#dc3545';
      setTimeout(() => {
        messageInput.style.borderColor = '';
      }, 500);
      return;
    }

    adicionarMensagem('user', mensagem);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();

    mostrarIndicadorDigitacao();

    setTimeout(() => {
      removerIndicadorDigitacao();
      const resposta = gerarRespostaBot(mensagem);
      adicionarMensagem('bot', resposta);
    }, 1400 + Math.random() * 900);
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
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-flask' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

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
   * Indicador de digitação
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
    avatarIcon.className = 'fa-solid fa-flask';
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
   * Respostas simuladas
   */
  function gerarRespostaBot(mensagem) {
    const texto = mensagem.toLowerCase();

    if (texto.includes('benefício') || texto.includes('percentual') || texto.includes('dedução')) {
      return `A **Lei do Bem (Lei 11.196/2005)** permite deduzir até **60%** das despesas de pesquisa e desenvolvimento da base de cálculo do IRPJ e da CSLL. 

**Escalonamento do benefício:**
- 60% sobre dispêndios operacionais padrão
- +20% para projetos que resultem em patentes ou cultivar registrado
- +20% quando houver aumento de pesquisadores dedicados a P&D

O percentual efetivo máximo pode alcançar **100% da despesa**. Posso detalhar como aplicar esse cálculo no seu cenário?`;
    }

    if (texto.includes('despesa') || texto.includes('qualifica') || texto.includes('elegível')) {
      return `São considerados **dispêndios elegíveis** para a Lei do Bem:

- Salários, encargos e bolsas de pesquisadores envolvidos em P&D
- Materiais de consumo e serviços ligados diretamente aos projetos
- Aquisição de softwares, equipamentos e protótipos para pesquisa
- Contratos com ICTs e startups para execução conjunta

Não entram despesas administrativas gerais, marketing ou aquisição de imóveis. Quer que eu avalie uma despesa específica?`;
    }

    if (texto.includes('mcti') || texto.includes('formpdi') || texto.includes('prestação de contas')) {
      return `**Prestação de contas ao MCTI**:

- Entrega do **FormP&D** até 31 de julho do ano subsequente
- Detalhar projetos, dispêndios, equipe e resultados obtidos
- Manter documentação comprobatória por pelo menos **5 anos**
- Recomenda-se trilha de auditoria com cronogramas, laudos e relatórios técnicos

Posso enviar um checklist dos documentos necessários para o seu dossiê?`;
    }

    if (texto.includes('requisitos') || texto.includes('empresa') || texto.includes('lucro real')) {
      return `Para usufruir da Lei do Bem, a empresa precisa:

1. Apurar tributos pelo **Lucro Real**
2. Ter lucro fiscal no período de apuração
3. Manter contabilidade segregada dos projetos de P&D
4. Investir em atividades enquadradas como **Pesquisa Aplicada**, **Desenvolvimento Experimental** ou **Inovação Tecnológica**
5. Entregar o FormP&D ao MCTI dentro do prazo

Se algum requisito não for atendido, o benefício pode ser glosado. Deseja que eu ajude a verificar esses pontos?`;
    }

    if (texto.includes('cronograma') || texto.includes('etapa') || texto.includes('processo')) {
      return `Um fluxo recomendado para projetos Lei do Bem:

1. **Planejamento**: definição de objetivos tecnológicos, orçamento e equipe
2. **Execução**: registrar entregáveis, horas dedicadas e resultados intermediários
3. **Classificação fiscal**: separar despesas elegíveis e não elegíveis
4. **Apuração do benefício**: aplicar percentuais e gerar memória de cálculo
5. **Relato técnico**: elaborar FormP&D e dossiê de suporte
6. **Acompanhamento**: monitorar parecer do MCTI e eventuais exigências

Posso detalhar como estruturar cada etapa no seu projeto.`;
    }

    return `Sou especialista na **Lei do Bem (P&D)** e posso ajudar com:

- Identificação de projetos elegíveis
- Estruturação de controles contábeis e fiscais
- Cálculo do benefício e memória de cálculo
- Preparação do FormP&D e dossiê técnico
- Auditoria preventiva para fiscalizações

Qual assunto você deseja aprofundar?`;
  }

  /**
   * Limpa o chat mantendo apenas a mensagem inicial
   */
  function limparChat() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const mensagens = chatWindow.querySelectorAll('.chat-message');
    mensagens.forEach((msg, index) => {
      if (index > 0) msg.remove();
    });
  }

  /**
   * Mensagem de erro em caso de falha na inicialização
   */
  function mostrarErroNoChat() {
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
          <strong>⚠️ Erro ao iniciar o agente Lei do Bem</strong><br><br>
          Não foi possível carregar a interface no momento. Recarregue a página ou tente novamente mais tarde.
        </div>
      </div>
    `;
    chatWindow.appendChild(erroDiv);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarChat, { once: true });
  } else {
    setTimeout(iniciarChat, 100);
  }
})();
