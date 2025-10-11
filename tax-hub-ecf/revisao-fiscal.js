let modoEdicao = false;

function inicializarRevisaoFiscal() {
    const temasProcessadosJSON = localStorage.getItem('temasRevisaoFiscal');
    const container = document.querySelector('.container-revisao');
    const btnSalvar = document.getElementById('btn-salvar-revisao');
    const btnProcessar = document.getElementById('btn-processar-revisao');
    
    if (!temasProcessadosJSON) {
        mostrarAvisoSemDados('Nenhum tema processado', 
            'Para começar a análise de revisão fiscal:<br>1. Vá para a aba <strong>"Balancete"</strong><br>2. Carregue um arquivo Excel<br>3. Clique em <strong>"Processar"</strong> para extrair os temas');
        return;
    }
    
    const temasData = JSON.parse(temasProcessadosJSON);
    const temasUnicos = temasData.temas || [];
    
    if (temasUnicos.length === 0) {
        mostrarAvisoSemDados('Erro no processamento', 
            'Não foi possível encontrar temas de revisão fiscal.<br>Por favor, retorne à aba "Balancete" e processe os dados novamente.');
        return;
    }
    
    // Garantir que a tabela e botões estejam visíveis
    const tabelaWrapper = document.querySelector('.tabela-wrapper');
    const botoesAcao = document.querySelector('.botoes-acao');
    if(tabelaWrapper) tabelaWrapper.style.display = 'block';
    if(botoesAcao) botoesAcao.style.display = 'flex';
    
    // Remover aviso se existir
    const avisoExistente = document.getElementById('aviso-sem-dados-revisao');
    if (avisoExistente) avisoExistente.remove();
    
    construirTabelaRevisao(temasUnicos);
    configurarEventListeners();
    restaurarEstadoSalvo(temasUnicos);
    atualizarEstadoBotoes();
}

function mostrarAvisoSemDados(titulo, mensagem) {
    const container = document.querySelector('.container-revisao');
    const tabelaWrapper = document.querySelector('.tabela-wrapper');
    const botoesAcao = document.querySelector('.botoes-acao');
    
    if(tabelaWrapper) tabelaWrapper.style.display = 'none';
    if(botoesAcao) botoesAcao.style.display = 'none';
    
    const avisoExistente = document.getElementById('aviso-sem-dados-revisao');
    if (avisoExistente) avisoExistente.remove();
    
    const aviso = document.createElement('div');
    aviso.id = 'aviso-sem-dados-revisao';
    aviso.style.cssText = 'text-align: center; padding: 40px; color: #666; font-size: 16px;';
    aviso.innerHTML = `
        <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 20px; display: block; color: #17a2b8;"></i>
        <h3 style="color: #333; margin-bottom: 15px;">${titulo}</h3>
        <p>${mensagem}</p>
    `;
    container.appendChild(aviso);
}

function construirTabelaRevisao(temasUnicos) {
    const tabelaBody = document.getElementById('revisao-fiscal-body');
    tabelaBody.innerHTML = ''; 
    
    temasUnicos.forEach(tema => {
        const linha = tabelaBody.insertRow();
        linha.setAttribute('data-tema', tema);
        linha.innerHTML = `
            <td style="font-weight: 600; background-color: #f8f9fa;">${tema}</td>
            <td>
                <select class="campo-selecao" id="ponto-${tema}" style="width: 100%; padding: 8px;">
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </select>
            </td>
            <td>
                <select class="campo-selecao classificacao-despesa" id="despesa-${tema}" style="width: 100%; padding: 8px;" data-tema="${tema}">
                    <option value="">Selecionar...</option>
                    <option value="Dedutível">Dedutível</option>
                    <option value="Indedutível">Indedutível</option>
                </select>
            </td>
            <td>
                <select class="campo-selecao" id="irpj-${tema}" style="width: 100%; padding: 8px;">
                    <option value="">Selecionar...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </select>
            </td>
            <td>
                <select class="campo-selecao" id="csll-${tema}" style="width: 100%; padding: 8px;">
                    <option value="">Selecionar...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </select>
            </td>
        `;
    });

    // Event listeners para mudança de classificação da despesa
    document.querySelectorAll('.classificacao-despesa').forEach(select => {
        select.addEventListener('change', function() {
            const tema = this.getAttribute('data-tema');
            const linha = document.querySelector(`tr[data-tema="${tema}"]`);
            const classificacao = this.value;
            
            linha.classList.remove('linha-dedutivel', 'linha-indedutivel');
            
            if (classificacao === 'Dedutível') {
                linha.classList.add('linha-dedutivel');
            } else if (classificacao === 'Indedutível') {
                linha.classList.add('linha-indedutivel');
            }
        });
    });
}

function configurarEventListeners() {
    // Configurar botões
    configurarBotaoSalvar();
    configurarBotaoProcessar();
    configurarBotaoEditar();
}

function configurarBotaoSalvar() {
    const btnSalvar = document.getElementById('btn-salvar-revisao');
    if (!btnSalvar) return;
    
    btnSalvar.disabled = false;
    btnSalvar.title = "Salvar a análise fiscal para processamento.";
    
    const novoBtnSalvar = btnSalvar.cloneNode(true);
    btnSalvar.parentNode.replaceChild(novoBtnSalvar, btnSalvar);
    
    document.getElementById('btn-salvar-revisao').addEventListener('click', salvarAnalise);
}

function configurarBotaoProcessar() {
    const btnProcessar = document.getElementById('btn-processar-revisao');
    if (!btnProcessar) return;
    
    const novoBtnProcessar = btnProcessar.cloneNode(true);
    btnProcessar.parentNode.replaceChild(novoBtnProcessar, btnProcessar);
    
    document.getElementById('btn-processar-revisao').addEventListener('click', () => {
        if (typeof processarDadosParaMemorando === 'function') {
            processarDadosParaMemorando();
        } else {
            alert("Erro: A função de processamento não foi encontrada.");
        }
    });
}

function configurarBotaoEditar() {
    // Verificar se já existe o botão de editar
    let btnEditar = document.getElementById('btn-editar-revisao');
    
    if (!btnEditar) {
        // Criar o botão de editar se não existir
        const botoesAcao = document.querySelector('.botoes-acao');
        btnEditar = document.createElement('button');
        btnEditar.id = 'btn-editar-revisao';
        btnEditar.className = 'btn-revisao';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar';
        btnEditar.title = "Editar análise salva";
        
        // Inserir antes do botão processar
        const btnProcessar = document.getElementById('btn-processar-revisao');
        botoesAcao.insertBefore(btnEditar, btnProcessar);
    }
    
    btnEditar.addEventListener('click', toggleModoEdicao);
    atualizarVisibilidadeBotaoEditar();
}

function toggleModoEdicao() {
    modoEdicao = !modoEdicao;
    const btnEditar = document.getElementById('btn-editar-revisao');
    const container = document.querySelector('.container-revisao');
    const campos = document.querySelectorAll('.campo-selecao');
    
    if (modoEdicao) {
        btnEditar.innerHTML = '<i class="fas fa-save"></i> Confirmar Edição';
        btnEditar.style.backgroundColor = '#28a745';
        container.classList.add('modo-edicao');
        
        campos.forEach(campo => {
            campo.disabled = false;
        });
        
        alert("Modo de edição ativado. Você pode agora modificar os campos.");
    } else {
        btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar';
        btnEditar.style.backgroundColor = '#17a2b8';
        container.classList.remove('modo-edicao');
        
        campos.forEach(campo => {
            campo.disabled = true;
        });
        
        // Salvar automaticamente as alterações
        salvarAnalise();
        alert("Edições salvas com sucesso!");
    }
}

function salvarAnalise() {
    const temasProcessadosJSON = localStorage.getItem('temasRevisaoFiscal');
    if (!temasProcessadosJSON) return;
    
    const temasData = JSON.parse(temasProcessadosJSON);
    const temasUnicos = temasData.temas || [];
    const estadoRevisao = {};
    let camposIncompletos = [];
    
    temasUnicos.forEach(tema => {
        const ponto = document.getElementById(`ponto-${tema}`)?.value || 'Sim';
        const despesa = document.getElementById(`despesa-${tema}`)?.value || '';
        const irpj = document.getElementById(`irpj-${tema}`)?.value || '';
        const csll = document.getElementById(`csll-${tema}`)?.value || '';
        
        // Verificar campos obrigatórios
        if (!despesa || !irpj || !csll) {
            camposIncompletos.push(tema);
        }
        
        estadoRevisao[tema] = {
            pontoIdentificado: ponto,
            classificacaoDespesa: despesa,
            afetaIRPJ: irpj,
            afetaCSLL: csll,
        };
    });
    
    if (camposIncompletos.length > 0) {
        alert(`Por favor, complete todos os campos para os seguintes temas:\n\n${camposIncompletos.join('\n')}`);
        return;
    }
    
    // Salvar no localStorage
    localStorage.setItem('revisaoFiscalState', JSON.stringify(estadoRevisao));
    
    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('revisaoFiscalSalva', { 
        detail: { estadoRevisao } 
    }));
    
    // Atualizar estado dos botões
    if (typeof atualizarEstadoBotoes === 'function') {
        setTimeout(() => {
            atualizarEstadoBotoes();
        }, 100);
    }
    
    if (!modoEdicao) {
        alert("Análise salva com sucesso!\n\nAgora você pode processar os dados na aba 'Balancete' ou aqui mesmo.");
    }
    
    atualizarVisibilidadeBotaoEditar();
    console.log('Revisão fiscal salva:', estadoRevisao);
}

function restaurarEstadoSalvo(temasUnicos) {
    const estadoSalvoJSON = localStorage.getItem('revisaoFiscalState');
    if (!estadoSalvoJSON) return;
    
    try {
        const estadoSalvo = JSON.parse(estadoSalvoJSON);
        temasUnicos.forEach(tema => {
            if (estadoSalvo[tema]) {
                const pontoEl = document.getElementById(`ponto-${tema}`);
                const despesaEl = document.getElementById(`despesa-${tema}`);
                const irpjEl = document.getElementById(`irpj-${tema}`);
                const csllEl = document.getElementById(`csll-${tema}`);
                
                if (pontoEl) pontoEl.value = estadoSalvo[tema].pontoIdentificado || 'Sim';
                if (despesaEl) {
                    despesaEl.value = estadoSalvo[tema].classificacaoDespesa || '';
                    const event = new Event('change', { bubbles: true });
                    despesaEl.dispatchEvent(event);
                }
                if (irpjEl) irpjEl.value = estadoSalvo[tema].afetaIRPJ || '';
                if (csllEl) csllEl.value = estadoSalvo[tema].afetaCSLL || '';
            }
        });
        
        // Desabilitar campos após restaurar
        const campos = document.querySelectorAll('.campo-selecao');
        campos.forEach(campo => {
            campo.disabled = true;
        });
        
    } catch (error) {
        console.error('Erro ao restaurar estado salvo:', error);
    }
}

function atualizarVisibilidadeBotaoEditar() {
    const btnEditar = document.getElementById('btn-editar-revisao');
    const estadoSalvo = localStorage.getItem('revisaoFiscalState');
    
    if (btnEditar) {
        if (estadoSalvo) {
            btnEditar.style.display = 'flex';
            btnEditar.disabled = false;
        } else {
            btnEditar.style.display = 'none';
        }
    }
}

// Event listener para detectar quando temas foram processados
window.addEventListener('temasProcessados', function(event) {
    console.log('Temas processados detectados:', event.detail);
    setTimeout(() => {
        if (typeof inicializarRevisaoFiscal === 'function') {
            inicializarRevisaoFiscal();
        }
    }, 500);
});

// Event listener para mudanças no localStorage
window.addEventListener('storage', function(e) {
    if (e.key === 'revisaoFiscalState') {
        setTimeout(() => {
            atualizarVisibilidadeBotaoEditar();
        }, 100);
    }
});