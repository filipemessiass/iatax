/**
 * ============================================
 * AGENT TAX CONSULT LEI DO BEM - SCRIPT PRINCIPAL
 * Gerenciamento completo do chat com validações
 * (Versão Padronizada e Autónoma)
 * ============================================
 */

(() => {
  // 1. CONFIGURA�?�fO DO AGENTE
  const CONFIG = {
    agentId: 'ldb',
    agentName: 'Agente Tax Consultor Lei do Bem (P&D)',
    apiContext: 'LEI_DO_BEM',
    // AJUSTE DE TEXTO: Corrigido
    closingMessage: 'Conversa encerrada. Para um novo atendimento sobre Lei do Bem, selecione novamente o agente.'
  };

  let chatFechado = false;
  let enviandoMensagem = false;

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
    
    try {
      adicionarListenersCustomizados();
      configurarAutoResize();
      configurarAtalhosTeclado();
      adicionarMensagemInicial(); // Adiciona a mensagem de boas-vindas
      
      console.log(`${CONFIG.agentName} inicializado com sucesso!`);
    } catch (erro) {
      console.error('Erro ao inicializar o agente Lei do Bem:', erro);
      mostrarErroNoChat();
    }
  }
  
  /**
   * 3.1. ADICIONAR MENSAGEM INICIAL (PADR�fO)
   * Adiciona a mensagem de boas-vindas do bot quando o chat é iniciado.
   */
  function adicionarMensagemInicial() {
    // AJUSTE DE TEXTO: Texto movido do HTML e corrigido para UTF-8
    const mensagemInicial = `Olá! Eu sou o seu assistente fiscal especializado na <strong>Lei do Bem</strong> (incentivos de P&D).
      <br><br>
      Posso ajudar com:
      <ul>
        <li>Requisitos para enquadramento e comprovação de P&D;</li>
        <li>Documentação técnica e relatórios necessários;</li>
        <li>Cálculo de incentivos fiscais e aproveitamento de créditos;</li>
        <li>Integração com obrigações acessórias (ECD, ECF, PER/DCOMP);</li>
        <li>Boas práticas de governança em projetos de inovação.</li>
      </ul>
      Em que posso te apoiar agora?`;

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
      'Escreva sua pergunta sobre Lei do Bem...',
      'Como calcular o benefício fiscal?',
      'Quais despesas podem ser enquadradas?',
      'Quais documentos preciso manter?',
      'Como funciona a prestação de contas ao MCTI?'
    ];
    let placeholderIndex = 0;

    // Lógica para trocar o placeholder a cada 5 segundos
    setInterval(() => {
      if (messageInput.value.trim() === '' && document.activeElement !== messageInput) {
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
        // AJUSTE DE TEXTO: Corrigido o placeholder no HTML
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
        // AJUSTE DE TEXTO: Corrigido "histórico"
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
    avatarIcon.className = tipo === 'bot' ? 'fa-solid fa-flask' : 'fa-solid fa-user';
    avatarDiv.appendChild(avatarIcon);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    if (typeof marked !== 'undefined') {
      try {
        bubbleDiv.innerHTML = marked.parse(conteudo);
      } catch(e) {
        bubbleDiv.textContent = conteudo;
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
   * 11. RESPOSTAS SIMULADAS (L�"GICA DO BOT)
   * AJUSTE DE TEXTO: Todos os textos foram corrigidos para UTF-8.
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
          <strong>�s�️ Erro ao iniciar o agente Lei do Bem</strong><br><br>
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
