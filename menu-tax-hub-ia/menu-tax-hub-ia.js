// ===================================================================
// ESTADO GLOBAL E LÓGICA DE DADOS DA APLICAÇÃO
// ===================================================================
let balanceteData = [];
let initialContentHTML = '';
let conversaAtual = null; // Para rastrear conversa em andamento

// ===================================================================
// FUNCOES DE HISTORICO DE CONVERSAS
// ===================================================================

function iniciarNovaConversa(agentId, agentName) {
    conversaAtual = {
        agentId: agentId,
        agentName: agentName,
        mensagens: [],
        iniciada: new Date().toISOString()
    };
}

function adicionarMensagemConversa(tipo, conteudo) {
    if (!conversaAtual) return;
    
    conversaAtual.mensagens.push({
        tipo: tipo, // 'user' ou 'bot'
        conteudo: conteudo,
        timestamp: new Date().toISOString()
    });
}

function finalizarESalvarConversa() {
    if (!conversaAtual || conversaAtual.mensagens.length === 0) return;
    
    try {
        const STORAGE_KEY = 'taxhub_conversas_historico';
        const historico = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        const novaConversa = {
            id: Date.now(),
            agentId: conversaAtual.agentId,
            agentName: conversaAtual.agentName,
            data: conversaAtual.iniciada,
            mensagens: conversaAtual.mensagens,
            preview: conversaAtual.mensagens[0]?.conteudo?.substring(0, 150) || 'Sem prévia disponível'
        };
        
        historico.unshift(novaConversa);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historico));
        
        console.log('? Conversa salva no histórico:', novaConversa.id);
        conversaAtual = null;
    } catch (error) {
        console.error('? Erro ao salvar conversa:', error);
    }
}

function recuperarConversaSalva() {
    try {
        const recuperar = sessionStorage.getItem('recuperar_conversa');
        if (recuperar) {
            const dados = JSON.parse(recuperar);
            sessionStorage.removeItem('recuperar_conversa');
            return dados;
        }
    } catch (error) {
        console.error('Erro ao recuperar conversa:', error);
    }
    return null;
}

// ===================================================================
// FUNÇÕES DE NAVEGA��O E MENU
// FUNCOES DE NAVEGACAO E MENU

function collapseAllMenus() {
    document.querySelectorAll('.menu-categoria .submenu').forEach(submenu => submenu.classList.remove('show'));
    document.querySelectorAll('.categoria-toggle').forEach(toggle => {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.submenu--nested').forEach(nested => nested.classList.remove('show'));
}

function expandMenuPath(targetLink) {
    if (!targetLink) {
        return;
    }

    let currentSubmenu = targetLink.closest('.submenu');
    while (currentSubmenu) {
        currentSubmenu.classList.add('show');
        const toggle = currentSubmenu.previousElementSibling;
        if (toggle && (toggle.classList.contains('categoria-toggle') || toggle.classList.contains('submenu-toggle'))) {
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }
        currentSubmenu = toggle ? toggle.closest('.submenu') : null;
    }
}

function restaurarConteudoInicial() {
    // Finalizar e salvar conversa atual antes de restaurar
    if (conversaAtual && conversaAtual.mensagens.length > 0) {
        finalizarESalvarConversa();
    }
    
    const container = document.getElementById('certidoes-content');
    if (container && initialContentHTML) {
        container.innerHTML = initialContentHTML;
        setupCategoryCardListeners();
        container.classList.remove('content--agent-active');
    }

    document.querySelectorAll('.sidebar .menu-link.active')
        .forEach(link => link.classList.remove('active'));

    collapseAllMenus();

    // COMENTARIO EDUCATIVO: O bloco de codigo que recolhia
// COMENTARIO EDUCATIVO: O bloco de codigo que recolhia
    
    atualizarEstadoBotoes();
}

function resolveAgentUrl(pagina) {
    if (!pagina) {
        return null;
    }

    try {
        return new URL(pagina, window.location.href).href;
    } catch (error) {
        console.warn('Não foi possível resolver a URL do agente:', pagina, error);
        return pagina;
    }
}

function isNetworkFetchError(error) {
    if (!error || !error.message) {
        return false;
    }

    const message = error.message.toLowerCase();
    return message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('load failed') ||
        message.includes('offline');
}

function carregarAgenteViaIframe(container, resolvedUrl, agentId, overlay, progressBar, statusText, titleText) {
    if (!container || !resolvedUrl) {
        return;
    }

    container.innerHTML = `
        <div class="agent-frame-wrapper">
            <div class="agent-frame-loader">
                <div class="agent-frame-loader__icon">
                    <i class="fas fa-robot"></i>
                </div>
                <p class="agent-frame-loader__text">Carregando agente...</p>
            </div>
            <iframe
                class="agent-frame"
                title="Agente Inteligente"
                loading="lazy"
                data-agent-id="${agentId || ''}"
                src="${resolvedUrl}"
            ></iframe>
        </div>
    `;

    configurarLayoutAgente(container);

    const iframe = container.querySelector('.agent-frame');
    const loader = container.querySelector('.agent-frame-loader');

    if (!iframe) {
        return;
    }

    const finalizarCarregamento = () => {
        if (loader) {
            loader.classList.add('agent-frame-loader--hidden');
            setTimeout(() => loader.remove(), 250);
        }
        if (overlay) overlay.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';
        if (titleText) titleText.textContent = 'Carregando Agente';
        if (statusText) statusText.textContent = 'Preparando interface...';
    };

    iframe.addEventListener('load', () => {
        finalizarCarregamento();

        try {
            const frameWindow = iframe.contentWindow;
            const frameDocument = frameWindow ? frameWindow.document : null;

            if (!frameWindow || !frameDocument) {
                return;
            }

            // COMENTARIO EDUCATIVO: A injecao de 'agent-chat.js' foi removida
            // COMENTARIO EDUCATIVO: A injecao de 'agent-chat.js' foi removida
            // pois os agentes agora sao autonomos.
            frameDocument.documentElement.style.height = '100%';
            frameDocument.body.style.height = '100%';
            const frameChatContainer = frameDocument.getElementById('chat-container') || frameDocument.querySelector('.agent-chat');
            if (frameChatContainer) {
                frameChatContainer.style.height = '100%';
                frameChatContainer.style.minHeight = '0';
                frameChatContainer.style.display = 'flex';
                frameChatContainer.style.flexDirection = 'column';
                frameChatContainer.style.width = '100%';
            }
        } catch (frameError) {
            console.warn('Não foi possível injetar scripts adicionais no iframe:', frameError);
        }
    });

    iframe.addEventListener('error', () => {
        finalizarCarregamento();
        container.innerHTML = `
            <div class="agent-error-card">
                <div class="agent-error-card__icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 class="agent-error-card__title">Não foi possível carregar o agente</h2>
                    Verifique se o arquivo <code>${resolvedUrl}</code> existe e esta acessivel.
                    Verifique se o arquivo <code>${resolvedUrl}</code> existe e est� acessível.
                </p>
            </div>
        `;
    });
}

function configurarLayoutAgente(container) {
    if (!container) {
        return;
    }

    container.classList.add('content--agent-active');
    container.scrollTop = 0;

    requestAnimationFrame(() => {
        const hostElements = [
            container.querySelector('#chat-container'),
            container.querySelector('.agent-chat'),
            container.querySelector('.agent-frame-wrapper')
        ].filter(Boolean);

        hostElements.forEach(element => {
            element.style.height = '100%';
            element.style.minHeight = '0';
            element.style.width = '100%';
            element.style.display = 'flex';
            element.style.flexDirection = 'column';
        });

        const iframe = container.querySelector('.agent-frame');
        if (iframe) {
            iframe.style.flex = '1';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.display = 'block';
        }
    });
}

// ===================================================================
// FUNÇÕES DE DADOS E BALANCETE
// ===================================================================

function salvarBalanceteNoStorage(rows) {
  try {
    localStorage.setItem('balanceteData', JSON.stringify(rows));
  } catch (error) {
    console.error("Erro ao salvar dados no localStorage:", error);
  }
}

function inicializarDadosBalancete() {
  const dadosSalvos = localStorage.getItem('balanceteData');
  if (dadosSalvos) {
    try {
      balanceteData = JSON.parse(dadosSalvos);
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      balanceteData = [];
    }
  }
}

function limparDadosBalancete() {
  balanceteData = [];
  localStorage.removeItem('balanceteData');
  localStorage.removeItem('revisaoFiscalState');
  localStorage.removeItem('temasRevisaoFiscal');
  localStorage.removeItem('memorandoData');
  
  const fileInput = document.getElementById("fileInput");
  const fileNameSpan = document.getElementById("fileName");
  const tabela = document.getElementById("tabelaBalancete");
  const statusMsg = document.getElementById("statusMessage");

  if (fileInput) fileInput.value = "";
  if (fileNameSpan) fileNameSpan.textContent = "Selecionar arquivo Excel";
  if (tabela) {
      tabela.style.display = "none";
      if(tabela.querySelector("tbody")) tabela.querySelector("tbody").innerHTML = "";
  }
  if (statusMsg) statusMsg.style.display = "none";
  
  atualizarEstadoBotoes();
  alert("Todos os dados da sessão foram limpos.");
}

function carregarArquivoBalancete() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) {
        alert("Por favor, selecione um arquivo Excel para carregar.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            balanceteData = rows.slice(1);
            salvarBalanceteNoStorage(balanceteData);
            
            localStorage.removeItem('revisaoFiscalState');
            localStorage.removeItem('temasRevisaoFiscal');
            localStorage.removeItem('memorandoData');
            
            renderizarTabelaBalancete(balanceteData, "Arquivo carregado com sucesso!");
            atualizarEstadoBotoes();
        } catch (error) {
            console.error("Erro ao processar o arquivo:", error);
            alert("Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// ===================================================================
// LÓGICA DE PROCESSAMENTO E CONTROLE DE ESTADO
// ===================================================================

function atualizarEstadoBotoes() {
    const btnProcessarBalancete = document.getElementById("btnProcessar");
    const btnProcessarRevisao = document.getElementById('btn-processar-revisao');
    const btnSalvarRevisao = document.getElementById('btn-salvar-revisao');
    const btnWordMemorando = document.getElementById('btn-exportar-word');
    const btnPptMemorando = document.getElementById('btn-exportar-ppt');
    
    const balanceteCarregado = balanceteData && balanceteData.length > 0;
    const revisaoSalva = localStorage.getItem('revisaoFiscalState');
    const temasProcessados = localStorage.getItem('temasRevisaoFiscal');
    const memorandoGerado = localStorage.getItem('memorandoData');

    if (btnProcessarBalancete) {
        if (balanceteCarregado) {
            btnProcessarBalancete.disabled = false;
            btnProcessarBalancete.title = "Extrair temas de revisão fiscal do balancete";
            btnProcessarBalancete.classList.add('enabled');
        } else {
            btnProcessarBalancete.disabled = true;
            btnProcessarBalancete.title = "Carregue um balancete primeiro";
            btnProcessarBalancete.classList.remove('enabled');
        }
    }

    if (btnSalvarRevisao) {
        if (temasProcessados) {
            btnSalvarRevisao.disabled = false;
            btnSalvarRevisao.title = "Salvar análise de revisão fiscal";
        } else {
            btnSalvarRevisao.disabled = true;
            btnSalvarRevisao.title = "Processe os dados na aba Balancete primeiro";
        }
    }

    if (btnProcessarRevisao) {
        if (temasProcessados && revisaoSalva) {
            btnProcessarRevisao.disabled = false;
            btnProcessarRevisao.title = "Gerar dados para o memorando";
            btnProcessarRevisao.classList.add('enabled');
        } else {
            btnProcessarRevisao.disabled = true;
            if (!temasProcessados) {
                btnProcessarRevisao.title = "Processe os dados na aba Balancete primeiro";
            } else {
                btnProcessarRevisao.title = "Salve a análise antes de processar para o memorando";
            }
            btnProcessarRevisao.classList.remove('enabled');
        }
    }

    if (btnWordMemorando) {
        if (memorandoGerado) {
            btnWordMemorando.disabled = false;
            btnWordMemorando.title = "Exportar memorando como Word";
        } else {
            btnWordMemorando.disabled = true;
            btnWordMemorando.title = "Complete o processamento nas abas anteriores";
        }
    }

    if (btnPptMemorando) {
        if (memorandoGerado) {
            btnPptMemorando.disabled = false;
            btnPptMemorando.title = "Exportar memorando como PowerPoint";
        } else {
            btnPptMemorando.disabled = true;
            btnPptMemorando.title = "Complete o processamento nas abas anteriores";
        }
    }
}

function inicializarMenuLateral() {
    const categoriaToggles = document.querySelectorAll('.categoria-toggle');
    categoriaToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            const submenu = toggle.nextElementSibling;
            if (!submenu) {
                return;
            }

            const submenuAberto = submenu.classList.contains('show');

            document.querySelectorAll('.menu-categoria .submenu.show').forEach(outroSubmenu => {
                if (outroSubmenu !== submenu) {
                    outroSubmenu.classList.remove('show');
                    const outroToggle = outroSubmenu.previousElementSibling;
                    if (outroToggle) {
                        outroToggle.classList.remove('active');
                        outroToggle.setAttribute('aria-expanded', 'false');
                    }
                    outroSubmenu.querySelectorAll('.submenu--nested.show').forEach(nested => nested.classList.remove('show'));
                    outroSubmenu.querySelectorAll('.submenu-toggle.active').forEach(nestedToggle => {
                        nestedToggle.classList.remove('active');
                        nestedToggle.setAttribute('aria-expanded', 'false');
                    });
                }
            });

            submenu.classList.toggle('show', !submenuAberto);
            toggle.classList.toggle('active', !submenuAberto);
            toggle.setAttribute('aria-expanded', (!submenuAberto).toString());

            if (submenuAberto) {
                submenu.querySelectorAll('.submenu--nested.show').forEach(nested => nested.classList.remove('show'));
                submenu.querySelectorAll('.submenu-toggle.active').forEach(nestedToggle => {
                    nestedToggle.classList.remove('active');
                    nestedToggle.setAttribute('aria-expanded', 'false');
                });
            }
        });
    });

    const nestedToggles = document.querySelectorAll('.submenu-toggle');
    nestedToggles.forEach(toggle => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', (event) => {
            event.preventDefault();
            const nestedMenu = toggle.nextElementSibling;
            if (!nestedMenu || !nestedMenu.classList.contains('submenu')) {
                return;
            }

            const isOpen = nestedMenu.classList.contains('show');
            const parentSubmenu = toggle.closest('.submenu');

            if (parentSubmenu) {
                parentSubmenu.querySelectorAll('.submenu--nested.show').forEach(list => {
                    if (list !== nestedMenu) {
                        list.classList.remove('show');
                    }
                });

                parentSubmenu.querySelectorAll('.submenu-toggle.active').forEach(otherToggle => {
                    if (otherToggle !== toggle) {
                        otherToggle.classList.remove('active');
                        otherToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }

            nestedMenu.classList.toggle('show', !isOpen);
            toggle.classList.toggle('active', !isOpen);
            toggle.setAttribute('aria-expanded', (!isOpen).toString());
        });
    });

    // COMENTARIO EDUCATIVO: A logica do 'sidebarToggleButton'
    // COMENTARIO EDUCATIVO: A logica do 'sidebarToggleButton'
    // o menu sempre visível, conforme solicitado.
}

function processarTemasRevisaoFiscal() {
    const overlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const titleText = document.getElementById('loading-title');
    
    if (!balanceteData || balanceteData.length === 0) {
        alert("Erro: Nenhum balancete carregado para processar.");
        return;
    }
    
    if (overlay) {
        overlay.style.display = 'flex';
        if (titleText) titleText.textContent = 'Processando Temas';
    }
    
    setTimeout(() => {
        if (progressBar) progressBar.style.width = '30%';
        if (statusText) statusText.textContent = 'Analisando balancete...';
        
        setTimeout(() => {
            if (progressBar) progressBar.style.width = '60%';
            if (statusText) statusText.textContent = 'Extraindo temas de revisão fiscal...';
            
            const itensComTemas = balanceteData.filter(row => {
                const tema = row && row[5];
                return tema && String(tema).trim() !== '' && String(tema).trim() !== '-' && String(tema).toLowerCase() !== 'null';
            });
            
            if (itensComTemas.length === 0) {
                setTimeout(() => {
                    if (overlay) overlay.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                    if (titleText) titleText.textContent = 'Processando Dados';
                    if (statusText) statusText.textContent = 'Iniciando...';
                    alert("⚠️ Nenhum tema de revisão fiscal encontrado no balancete.\n\nVerifique se a coluna 'Revisão Fiscal' (6ª coluna) possui dados preenchidos.");
                }, 500);
                return;
            }
            
            const temasUnicos = [...new Set(itensComTemas.map(item => String(item[5]).trim()))];
            
            setTimeout(() => {
                if (progressBar) progressBar.style.width = '90%';
                if (statusText) statusText.textContent = 'Preparando dados para revisão...';
                
                const temasData = {
                    temas: temasUnicos,
                    itensRelacionados: itensComTemas,
                    dataProcessamento: new Date().toISOString(),
                    totalItens: itensComTemas.length
                };
                
                localStorage.setItem('temasRevisaoFiscal', JSON.stringify(temasData));
                
                setTimeout(() => {
                    if (progressBar) progressBar.style.width = '100%';
                    if (titleText) titleText.textContent = 'Concluído!';
                    if (statusText) statusText.textContent = `${temasUnicos.length} tema(s) extraído(s) com sucesso.`;
                    
                    setTimeout(() => {
                        if (overlay) {
                            overlay.style.display = 'none';
                            if (progressBar) progressBar.style.width = '0%';
                            if (titleText) titleText.textContent = 'Processando Dados';
                            if (statusText) statusText.textContent = 'Iniciando...';
                        }
                        
                        atualizarEstadoBotoes();
                        window.dispatchEvent(new CustomEvent('temasProcessados', { 
                            detail: { temas: temasUnicos, totalItens: itensComTemas.length } 
                        }));
                        
                        const listaTemasFormatada = temasUnicos.map((tema, i) => `${i+1}. ${tema}`).join('\n');
                        alert(`Processamento concluído com sucesso!\n\nResumo:\n. ${temasUnicos.length} tema(s) de revisão fiscal encontrado(s)\n. ${itensComTemas.length} conta(s) contábil(is) relacionada(s)\n\nTemas encontrados:\n${listaTemasFormatada}\n\nAgora vá para a aba "Revisão Fiscal" para fazer a análise detalhada.`);
                        
                    }, 1500);
                }, 500);
            }, 800);
        }, 800);
    }, 500);
}

function processarDadosParaMemorando() {
    const overlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const titleText = document.getElementById('loading-title');
    const revisaoStateJSON = localStorage.getItem('revisaoFiscalState');
    
    if (!balanceteData || balanceteData.length === 0 || !revisaoStateJSON) {
        alert("Erro: Não há dados suficientes para processar.\nVerifique se:\n1. O balancete foi carregado\n2. A análise de revisão fiscal foi salva");
        return;
    }
    
    const revisaoState = JSON.parse(revisaoStateJSON);
    overlay.style.display = 'flex';
    titleText.textContent = 'Gerando Memorando';
    let memorandoData = {};
    
    setTimeout(() => {
        progressBar.style.width = '25%';
        statusText.textContent = 'Lendo dados da Revisão Fiscal...';
        
        setTimeout(() => {
            progressBar.style.width = '50%';
            statusText.textContent = 'Cruzando informações com o Balancete...';
            
            for (const tema in revisaoState) {
                const analise = revisaoState[tema];
                const contasRelacionadas = balanceteData.filter(row => row && row[5] === tema);
                const baseCalculo = contasRelacionadas.reduce((sum, row) => sum + (Number(row[4]) || 0), 0);
                memorandoData[tema] = {
                    analise: analise,
                    contas: contasRelacionadas.map(row => ({ 
                        conta: row[0], 
                        descricao: row[1], 
                        saldoFinal: row[4] 
                    })),
                    baseCalculoTotal: baseCalculo
                };
            }
            
            setTimeout(() => {
                progressBar.style.width = '90%';
                statusText.textContent = 'Salvando dados para o Memorando...';
                localStorage.setItem('memorandoData', JSON.stringify(memorandoData));
                
                setTimeout(() => {
                    progressBar.style.width = '100%';
                    titleText.textContent = 'Concluído!';
                    statusText.textContent = 'Memorando gerado com sucesso.';
                    
                    setTimeout(() => {
                        overlay.style.display = 'none';
                        progressBar.style.width = '0%';
                        titleText.textContent = 'Processando Dados';
                        statusText.textContent = 'Iniciando...';
                        
                        atualizarEstadoBotoes();
                        alert("Memorando gerado com sucesso!\n\nVocê pode acessá-lo na aba 'Memorando'.");
                    }, 1500);
                }, 500);
            }, 1000);
        }, 1000);
    }, 500);
}

// Event listeners para mudanças no localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'revisaoFiscalState' || e.key === 'temasRevisaoFiscal' || e.key === 'memorandoData') {
        setTimeout(() => atualizarEstadoBotoes(), 100);
    }
});

window.addEventListener('revisaoFiscalSalva', function(event) {
    setTimeout(() => atualizarEstadoBotoes(), 100);
});

window.addEventListener('temasProcessados', function(event) {
    setTimeout(() => atualizarEstadoBotoes(), 100);
});

// ===================================================================
// FUNÇÕES PARA OS ATALHOS DOS CARDS
// ===================================================================

function setupCategoryCardListeners() {
    const categoryCards = document.querySelectorAll('.category-card[data-highlight-menu]');
    categoryCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.agent-tag') || e.target.closest('.region-badge')) {
                return;
            }
            
            const menuId = this.getAttribute('data-highlight-menu');
            if (!menuId) return;
            
            collapseAllMenus();
            
            const category = document.querySelector('.menu-categoria[data-menu-id="' + menuId + '"]');
            if (!category) return;
            
            const toggle = category.querySelector('.categoria-toggle');
            if (!toggle) return;
            
            if (!toggle.classList.contains('active')) {
                toggle.click();
            }
            
            category.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.boxShadow = '0 0 30px rgba(122, 193, 67, 0.3)';
                setTimeout(() => {
                    sidebar.style.boxShadow = '';
                }, 1000);
            }
        });
    });
    
    const agentTags = document.querySelectorAll('.agent-tag[data-highlight-agent]');
    agentTags.forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const agentId = this.getAttribute('data-highlight-agent');
            if (!agentId) return;
            
            collapseAllMenus();
            
            const targetLink = document.querySelector('.menu-link[data-agent="' + agentId + '"]');
            if (!targetLink) {
                console.error('Link do agente não encontrado:', agentId);
                return;
            }
            
            expandMenuPath(targetLink);
            
            targetLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            targetLink.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            setTimeout(() => {
                targetLink.style.backgroundColor = '';
            }, 1000);
            
            setTimeout(() => {
                targetLink.click();
            }, 300);
        });
    });
}

// ===================================================================
// LOGICA DE NAVEGACAO E INICIALIZACAO
// LOGICA DE NAVEGACAO E INICIALIZACAO

document.addEventListener('DOMContentLoaded', () => {
    inicializarDadosBalancete();
    inicializarMenuLateral();
    
    const contentElement = document.getElementById('certidoes-content');
    if (contentElement) {
        initialContentHTML = contentElement.innerHTML;
    }
    
    const userName = localStorage.getItem('username');
    if (userName) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = userName;
    }
    
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = './Login/login.html';
        });
    }
    
    const menuLinks = document.querySelectorAll('.sidebar .menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const pagina = this.getAttribute('data-page');
            const agentId = this.getAttribute('data-agent');
            const agentName = this.textContent.trim();
            
            if (pagina) {
                carregarConteudo(pagina, agentId, agentName);
            }
        });
    });

    setupCategoryCardListeners();

    setTimeout(() => {
        atualizarEstadoBotoes();
    }, 100);

    document.addEventListener('chat:closed', () => {
        restaurarConteudoInicial();
    });

    window.addEventListener('message', (event) => {
        if (!event || !event.data) {
            return;
        }

        if (event.data.type === 'chat-closed') {
            restaurarConteudoInicial();
        }
        
        // Listener para salvar mensagens do chat
        if (event.data.type === 'chat-message') {
            adicionarMensagemConversa(event.data.messageType, event.data.content);
        }
        
        // Listener para recuperar conversa
        if (event.data.type === 'recuperar-conversa') {
            const link = document.querySelector(`.menu-link[data-agent="${event.data.agentId}"]`);
            if (link) {
                link.click();
            }
        }
    });
    
    // Verificar se há conversa para recuperar
    const conversaRecuperar = recuperarConversaSalva();
    if (conversaRecuperar) {
        setTimeout(() => {
            const link = document.querySelector(`.menu-link[data-agent="${conversaRecuperar.agentId}"]`);
            if (link) {
                link.click();
                
                // Aguardar carregamento do agente para injetar mensagens
                setTimeout(() => {
                    window.postMessage({
                        type: 'restaurar-conversa',
                        mensagens: conversaRecuperar.mensagens
                    }, '*');
                }, 2000);
            }
        }, 500);
    }
});

function carregarConteudo(pagina, agentId, agentName) {
    const container = document.getElementById('certidoes-content');
    const overlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const titleText = document.getElementById('loading-title');
    const resolvedUrl = resolveAgentUrl(pagina);
    
    // Iniciar nova conversa se for um agente
    if (agentId && agentId !== 'historico') {
        iniciarNovaConversa(agentId, agentName);
    }
    
    if (overlay) {
        overlay.style.display = 'flex';
        if (titleText) titleText.textContent = 'Carregando Agente';
        if (statusText) statusText.textContent = 'Preparando interface...';
        if (progressBar) progressBar.style.width = '30%';
    }
    
    fetch(resolvedUrl, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Não foi possível carregar o arquivo ${resolvedUrl}`);
            }
            
            if (progressBar) progressBar.style.width = '60%';
            if (statusText) statusText.textContent = 'Carregando recursos...';
            
            return response.text();
        })
        .then(html => {
            if (progressBar) progressBar.style.width = '90%';
            if (statusText) statusText.textContent = 'Renderizando interface...';
            
            setTimeout(() => {
                container.innerHTML = html;
                configurarLayoutAgente(container);
                
                const scripts = container.querySelectorAll('script');
                
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    
                    Array.from(oldScript.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    
                    document.body.appendChild(newScript);
                    oldScript.remove();
                });
                
                if (progressBar) progressBar.style.width = '100%';
                if (statusText) statusText.textContent = 'Concluído!';
                
                setTimeout(() => {
                    if (overlay) {
                        overlay.style.display = 'none';
                        if (progressBar) progressBar.style.width = '0%';
                        if (titleText) titleText.textContent = 'Carregando Agente';
                        if (statusText) statusText.textContent = 'Preparando interface...';
                    }
                    
                    if (pagina.includes('balancete.html')) {
                        setTimeout(() => {
                            if (typeof renderizarTabelaBalancete === 'function') {
                                renderizarTabelaBalancete(balanceteData, "Dados restaurados da última sessão.");
                            }
                            
                            const btnProcessar = document.getElementById("btnProcessar");
                            if (btnProcessar) {
                                btnProcessar.onclick = null;
                                btnProcessar.removeAttribute('onclick');
                                btnProcessar.addEventListener('click', function(e) {
                                    e.preventDefault();
                                    processarTemasRevisaoFiscal();
                                });
                            }
                            
                            atualizarEstadoBotoes();
                        }, 100);
                    } else if (pagina.includes('revisao-fiscal.html')) {
                        setTimeout(() => {
                            if (typeof inicializarRevisaoFiscal === 'function') {
                                inicializarRevisaoFiscal();
                            }
                            atualizarEstadoBotoes();
                        }, 100);
                    } else if (pagina.includes('memorando.html')) {
                        setTimeout(() => {
                            if (typeof inicializarMemorando === 'function') {
                                inicializarMemorando();
                            }
                            atualizarEstadoBotoes();
                        }, 100);
                    } else if (pagina.includes('historico.html')) {
                        // Página de histórico carregada
                        console.log('Página de histórico carregada');
                    }
                }, 500);
            }, 300);
        })
        .catch(error => {
            console.error("Erro detalhado ao carregar conteúdo:", error);
            
            if (isNetworkFetchError(error) && resolvedUrl) {
                console.warn('Falha de rede ao carregar agente via fetch. Alternando para iframe.', resolvedUrl);
                carregarAgenteViaIframe(container, resolvedUrl, agentId, overlay, progressBar, statusText, titleText);
                return;
            }
            
            if (overlay) {
                overlay.style.display = 'none';
                if (progressBar) progressBar.style.width = '0%';
            }
            
            container.classList.add('content--agent-active');
            container.scrollTop = 0;

            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 4rem; color: #0F0F0F; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 style="color: #0F0F0F; margin-bottom: 15px;">Erro ao Carregar Agente</h2>
                    <p style="color: #0F0F0F; margin-bottom: 20px; font-size: 1.1rem;">
                        Não foi possível carregar o agente solicitado.
                    </p>
                    <div style="background: #FFFFFF; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06); border-left: 4px solid #7AC143; padding: 15px; margin: 20px auto; max-width: 600px; text-align: left;">
                        <strong>Detalhes do erro:</strong><br>
                        <code style="color: #0F0F0F;">${error.message}</code>
                    </div>
                    <div style="margin-top: 30px;">
                        <p style="color: #0F0F0F; margin-bottom: 15px;"><strong>Possíveis causas:</strong></p>
                        <ul style="list-style: none; padding: 0; color: #0F0F0F;">
                            <li style="margin-bottom: 10px;">
                                <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 10px; color: #0F0F0F;"></i>
                                O arquivo do agente não existe no caminho especificado
                            </li>
                            <li style="margin-bottom: 10px;">
                                <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 10px; color: #0F0F0F;"></i>
                                Problema de conexão ou permissões de acesso
                            </li>
                            <li style="margin-bottom: 10px;">
                                <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 10px; color: #0F0F0F;"></i>
                                Caminho relativo incorreto na estrutura de pastas
                            </li>
                        </ul>
                    </div>
                    <div style="margin-top: 30px;">
                        <button 
                            onclick="location.reload()" 
                            style="padding: 12px 30px; background: linear-gradient(135deg, #7AC143 0%, rgba(122, 193, 67, 0.85) 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600; box-shadow: 0 4px 15px rgba(122, 193, 67, 0.2);">
                            <i class="fas fa-redo-alt" style="margin-right: 8px;"></i>
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            `;
            
            document.querySelectorAll('.sidebar .menu-link.active')
                .forEach(link => link.classList.remove('active'));
        });
}

// Disponibilizar funções globalmente
window.salvarConversa = finalizarESalvarConversa;
window.adicionarMensagemConversa = adicionarMensagemConversa;
window.restaurarConteudoInicial = restaurarConteudoInicial;



















