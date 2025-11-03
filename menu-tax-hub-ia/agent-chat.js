(() => {
  const DEFAULT_API_URL = 'http://localhost:3000/api/chat';

  function initializeAgentChat(config) {
    if (!config) {
      console.error('initializeAgentChat requer um objeto de configuração.');
      return;
    }

    const settings = {
      containerId: 'chat-container',
      windowId: 'chat-window',
      formId: 'chat-form',
      inputId: 'message-input',
      sendButtonId: 'send-button',
      closeSelector: '[data-close-chat]',
      apiUrl: DEFAULT_API_URL,
      closingMessage: 'Conversa encerrada. Para iniciar um novo atendimento, selecione novamente um agente.',
      ...config
    };

    const {
      agentId,
      agentName,
      apiContext,
      containerId,
      windowId,
      formId,
      inputId,
      sendButtonId,
      closeSelector,
      apiUrl,
      closingMessage
    } = settings;

    const chatContainer = document.getElementById(containerId);
    const chatWindow = document.getElementById(windowId);
    const chatForm = document.getElementById(formId);
    const messageInput = document.getElementById(inputId);
    const sendButton = document.getElementById(sendButtonId);
    const closeButton = chatContainer ? chatContainer.querySelector(closeSelector) : null;

    if (!chatContainer || !chatWindow || !chatForm || !messageInput || !sendButton) {
      console.error('Não foi possível inicializar o chat: elementos obrigatórios não encontrados.', {
        containerId,
        windowId,
        formId,
        inputId,
        sendButtonId
      });
      return;
    }

    let chatClosed = false;

    autoResizeTextarea(messageInput);

    messageInput.addEventListener('input', () => autoResizeTextarea(messageInput));
    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });

    chatForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (chatClosed) {
        return;
      }

      const userMessage = messageInput.value.trim();
      if (!userMessage) {
        return;
      }

      appendMessage(chatWindow, userMessage, 'user', { markdown: false });

      messageInput.value = '';
      autoResizeTextarea(messageInput);
      sendButton.disabled = true;

      const loadingIndicator = appendLoadingMessage(chatWindow);

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt: userMessage,
            context: apiContext
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'O servidor retornou uma resposta inválida.');
        }

        const data = await response.json();
        loadingIndicator.remove();

        appendMessage(chatWindow, data.reply || 'Sem resposta do agente.', 'bot', { markdown: true });
      } catch (error) {
        console.error(`Erro no agente ${agentId}:`, error);
        loadingIndicator.remove();
        appendMessage(
          chatWindow,
          `**Ocorreu um erro ao contatar o agente.**\n\n${error.message}\n\n` +
            `Verifique se:\n` +
            `- O backend está em execução;\n` +
            `- O endpoint \`${apiUrl}\` está acessível;\n` +
            `- Sua conexão de rede está ativa.`,
          'bot',
          { markdown: true }
        );
      } finally {
        if (!chatClosed) {
          sendButton.disabled = false;
          messageInput.disabled = false;
          messageInput.focus();
        }
      }
    });

    if (closeButton) {
      closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        fecharConversa();
      });
    }

    function fecharConversa() {
      if (chatClosed) {
        return;
      }
      chatClosed = true;
      chatContainer.classList.add('chat-closed');

      appendMessage(chatWindow, closingMessage, 'bot', { markdown: false });

      messageInput.value = '';
      messageInput.disabled = true;
      sendButton.disabled = true;

      chatContainer.dispatchEvent(
        new CustomEvent('chat:closed', {
          bubbles: true,
          detail: { agentId, agentName }
        })
      );

      if (window.parent && window.parent !== window) {
        try {
          window.parent.postMessage(
            {
              type: 'chat-closed',
              agentId,
              agentName
            },
            '*'
          );
        } catch (postMessageError) {
          console.warn('Não foi possível enviar mensagem de fechamento ao parent.', postMessageError);
        }
      }
    }

    setTimeout(() => {
      if (!chatClosed) {
        messageInput.focus();
      }
    }, 400);
  }

  function appendMessage(chatWindow, content, sender, options = {}) {
    const { markdown = false } = options;
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);

    if (markdown && typeof marked !== 'undefined' && typeof marked.parse === 'function') {
      messageElement.innerHTML = marked.parse(content);
    } else {
      messageElement.textContent = content;
    }

    chatWindow.appendChild(messageElement);
    rolarParaFim(chatWindow);
    return messageElement;
  }

  function appendLoadingMessage(chatWindow) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', 'bot', 'loading');
    messageElement.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatWindow.appendChild(messageElement);
    rolarParaFim(chatWindow);
    return messageElement;
  }

  function rolarParaFim(container) {
    setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }, 80);
  }

  function autoResizeTextarea(textarea) {
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    const nextHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${nextHeight}px`;
  }

  window.initializeAgentChat = initializeAgentChat;
})();
