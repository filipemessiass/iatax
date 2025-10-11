// ===================================================================
// ESTADO GLOBAL E LÓGICA DE DADOS DA APLICAÇÃO
// ===================================================================
let balanceteData = [];

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
            
            // Limpar estados anteriores quando novo balancete é carregado
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

    console.log('Atualizando estado dos botões:', { 
        balanceteCarregado, 
        revisaoSalva: !!revisaoSalva,
        temasProcessados: !!temasProcessados,
        memorandoGerado: !!memorandoGerado 
    });

    // Botão Processar na aba Balancete
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

    // Botões na aba Revisão Fiscal
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

    // Botões na aba Memorando
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

function processarTemasRevisaoFiscal() {
    console.log('processarTemasRevisaoFiscal chamada');
    
    const overlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('loading-status-text');
    const titleText = document.getElementById('loading-title');
    
    if (!balanceteData || balanceteData.length === 0) {
        alert("Erro: Nenhum balancete carregado para processar.");
        return;
    }
    
    console.log('Dados do balancete:', balanceteData.length, 'linhas');
    
    // Mostrar overlay de loading
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
            
            // Extrair itens que possuem tema de revisão fiscal (coluna 6, índice 5)
            const itensComTemas = balanceteData.filter(row => {
                const tema = row && row[5];
                return tema && String(tema).trim() !== '' && String(tema).trim() !== '-' && String(tema).toLowerCase() !== 'null';
            });
            
            console.log('Itens com temas encontrados:', itensComTemas.length);
            console.log('Primeira linha com tema:', itensComTemas[0]);
            
            if (itensComTemas.length === 0) {
                setTimeout(() => {
                    if (overlay) overlay.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                    if (titleText) titleText.textContent = 'Processando Dados';
                    if (statusText) statusText.textContent = 'Iniciando...';
                    alert("⚠ Nenhum tema de revisão fiscal encontrado no balancete.\n\nVerifique se a coluna 'Revisão Fiscal' (6ª coluna) possui dados preenchidos.\n\nExemplos de temas válidos:\n- Despesas com Alimentação\n- Gastos com Veículos\n- Outras Despesas Operacionais");
                }, 500);
                return;
            }
            
            // Extrair temas únicos
            const temasUnicos = [...new Set(itensComTemas.map(item => String(item[5]).trim()))];
            console.log('Temas únicos encontrados:', temasUnicos);
            
            setTimeout(() => {
                if (progressBar) progressBar.style.width = '90%';
                if (statusText) statusText.textContent = 'Preparando dados para revisão...';
                
                // Salvar temas extraídos
                const temasData = {
                    temas: temasUnicos,
                    itensRelacionados: itensComTemas,
                    dataProcessamento: new Date().toISOString(),
                    totalItens: itensComTemas.length
                };
                
                localStorage.setItem('temasRevisaoFiscal', JSON.stringify(temasData));
                console.log('Dados salvos no localStorage:', temasData);
                
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
                        
                        // Atualizar estado dos botões
                        atualizarEstadoBotoes();
                        
                        // Disparar evento para notificar outras partes da aplicação
                        window.dispatchEvent(new CustomEvent('temasProcessados', { 
                            detail: { temas: temasUnicos, totalItens: itensComTemas.length } 
                        }));
                        
                        // Mostrar resultado
                        const listaTemasFormatada = temasUnicos.map((tema, i) => `${i+1}. ${tema}`).join('\n');
                        alert(`✅ Processamento concluído com sucesso!\n\n📊 Resumo:\n• ${temasUnicos.length} tema(s) de revisão fiscal encontrado(s)\n• ${itensComTemas.length} conta(s) contábil(is) relacionada(s)\n\n📋 Temas encontrados:\n${listaTemasFormatada}\n\n➡️ Agora vá para a aba "Revisão Fiscal" para fazer a análise detalhada.`);
                        
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
                        
                        // Atualizar estado dos botões
                        atualizarEstadoBotoes();
                        
                        alert("✅ Memorando gerado com sucesso!\n\nVocê pode acessá-lo na aba 'Memorando'.");
                    }, 1500);
                }, 500);
            }, 1000);
        }, 1000);
    }, 500);
}

// Event listener para mudanças no localStorage (sincronização entre abas)
window.addEventListener('storage', function(e) {
    if (e.key === 'revisaoFiscalState' || e.key === 'temasRevisaoFiscal' || e.key === 'memorandoData') {
        console.log('Detectada mudança no localStorage:', e.key, e.newValue);
        setTimeout(() => atualizarEstadoBotoes(), 100);
    }
});

// Event listeners para eventos customizados
window.addEventListener('revisaoFiscalSalva', function(event) {
    console.log('Revisão fiscal salva detectada');
    setTimeout(() => atualizarEstadoBotoes(), 100);
});

window.addEventListener('temasProcessados', function(event) {
    console.log('Temas processados detectados:', event.detail);
    setTimeout(() => atualizarEstadoBotoes(), 100);
});

// ===================================================================
// LÓGICA DE NAVEGAÇÃO E INICIALIZAÇÃO
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarDadosBalancete();
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
            if (pagina) {
                carregarConteudo(pagina);
            }
        });
    });

    // Atualizar estado inicial dos botões
    setTimeout(() => {
        atualizarEstadoBotoes();
    }, 100);
});

function carregarConteudo(pagina) {
  const container = document.getElementById('certidoes-content');
  
  fetch(pagina)
    .then(response => {
      if (!response.ok) throw new Error(`Não foi possível encontrar o arquivo: ${pagina}.`);
      return response.text();
    })
    .then(html => {
      container.innerHTML = html;
      
      // Reexecutar scripts da página carregada
      container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.innerHTML = oldScript.innerHTML;
        document.body.appendChild(newScript);
        oldScript.remove();
      });
      
      // Inicializar conteúdo específico da página
      if (pagina.includes('balancete.html')) {
          setTimeout(() => {
              if (typeof renderizarTabelaBalancete === 'function') {
                  renderizarTabelaBalancete(balanceteData, "Dados restaurados da última sessão.");
              }
              
              // Garantir que o botão Processar tenha o event listener correto
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
      }
    })
    .catch(error => {
      container.innerHTML = `<p style="color: #dc3545; padding: 20px; font-weight: bold;">${error.message}</p>`;
      console.error("Falha ao carregar conteúdo:", error);
    });
}