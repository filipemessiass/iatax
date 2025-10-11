document.addEventListener('DOMContentLoaded', inicializarMemorando);

function inicializarMemorando() {
  console.log('Inicializando memorando...');
  const memorandoDataJSON = localStorage.getItem('memorandoData');
  const revisaoStateJSON = localStorage.getItem('revisaoFiscalState');
  const container = document.getElementById('memorando-content');
  const aviso = document.getElementById('aviso-sem-dados-memorando');
  const btnWord = document.getElementById('btn-exportar-word');
  const btnPpt = document.getElementById('btn-exportar-ppt');

  if (!memorandoDataJSON || !revisaoStateJSON) {
    mostrarAviso();
    return;
  }

  const memorandoData = JSON.parse(memorandoDataJSON);
  const revisaoState = JSON.parse(revisaoStateJSON);

  // Filtrar apenas pontos identificados como "Sim"
  let pontosParaRenderizar = [];
  let contadorPonto = 1;

  for (const tema in memorandoData) {
    const dadosPonto = memorandoData[tema];
    const analise = revisaoState[tema];
    
    if (analise && analise.pontoIdentificado === 'Sim') {
      pontosParaRenderizar.push({
        numero: contadorPonto++,
        tema: tema,
        dados: dadosPonto,
        analise: analise
      });
    }
  }

  if (pontosParaRenderizar.length === 0) {
    mostrarAviso();
    return;
  }

  // Gerar HTML do memorando
  gerarConteudoMemorando(pontosParaRenderizar);
  
  // Mostrar conteúdo e habilitar botões
  container.style.display = 'block';
  aviso.style.display = 'none';
  btnWord.disabled = false;
  btnPpt.disabled = false;
  
  configurarExportacao();
}

function mostrarAviso() {
  const container = document.getElementById('memorando-content');
  const aviso = document.getElementById('aviso-sem-dados-memorando');
  const btnWord = document.getElementById('btn-exportar-word');
  const btnPpt = document.getElementById('btn-exportar-ppt');
  
  container.style.display = 'none';
  aviso.style.display = 'flex';
  btnWord.disabled = true;
  btnPpt.disabled = true;
}

function gerarConteudoMemorando(pontosParaRenderizar) {
  const container = document.getElementById('memorando-content');
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  
  let htmlContent = `
    <div class="memorando-header">
      <h2>Memorando de Riscos Fiscais</h2>
      <div class="memorando-separador"></div>
      <h3>CARTA DE CONTROLE INTERNO – ÁREA TRIBUTÁRIA</h3>
    </div>
    
    <div class="memorando-destinatario">
      <p><strong>Destinatário:</strong> Equipe de Auditoria Independente</p>
      <p><strong>Emitente:</strong> [Business Tax] – [Nome da Empresa]</p>
      <p><strong>Período:</strong> [dd/mm/aaaa]</p>
      <p><strong>Data de Emissão:</strong> ${dataAtual}</p>
      <div class="documento-confidencial">
        Documento confidencial – uso restrito à Administração e à Auditoria.
      </div>
      <div class="linha-separadora"></div>
    </div>
  `;

  // Gerar pontos principais
  pontosParaRenderizar.forEach(ponto => {
    const valorTotal = ponto.dados.baseCalculoTotal || 0;
    const classificacao = ponto.analise.classificacaoDespesa;
    const afetaIRPJ = ponto.analise.afetaIRPJ;
    const afetaCSLL = ponto.analise.afetaCSLL;
    
    const tituloCompleto = classificacao === 'Indedutível' ? 
      `Indedutibilidade de ${ponto.tema} e Risco de Glosa de IRPJ/CSLL` :
      `Análise de ${ponto.tema} para Fins Fiscais`;

    htmlContent += `
      <div class="ponto-principal">
        <h4 class="ponto-titulo">
          Ponto ${String(ponto.numero).padStart(2, '0')} – ${tituloCompleto}
        </h4>
        
        <div class="conteudo-ponto">
    `;

    // Conteúdo baseado na classificação
    if (classificacao === 'Indedutível') {
      htmlContent += `
        <p>
          Foi identificado que a Sociedade declarou o pagamento de <strong>${formatCurrencyBR(valorTotal)}</strong> 
          a título de ${ponto.tema.toLowerCase()}, registrando o valor como despesa operacional e 
          deduzindo-o ${afetaIRPJ === 'Sim' || afetaCSLL === 'Sim' ? 'integralmente' : 'parcialmente'} 
          da base de cálculo do ${afetaIRPJ === 'Sim' ? 'IRPJ' : ''}${afetaIRPJ === 'Sim' && afetaCSLL === 'Sim' ? ' e ' : ''}${afetaCSLL === 'Sim' ? 'CSLL' : ''}, 
          sem a devida adição no LALUR/LACS.
        </p>
        
        <p>
          Atualmente, o CARF e o STJ possuem entendimento consolidado de que despesas desta natureza 
          são indedutíveis, por não atenderem aos requisitos de necessidade e normalidade previstos 
          no art. 311 do RIR/2018. A manutenção da dedução representa uma contingência fiscal material, 
          sujeita à glosa do valor, com aplicação de multa de ofício de 75% e juros Selic, 
          conforme art. 44 da Lei nº 9.430/96.
        </p>
        
        <p>
          Recomendamos que a Sociedade realize os devidos ajustes, promovendo a adição do valor de 
          <strong>${formatCurrencyBR(valorTotal)}</strong> ao LALUR e LACS, com o consequente 
          recolhimento das diferenças de ${afetaIRPJ === 'Sim' ? 'IRPJ' : ''}${afetaIRPJ === 'Sim' && afetaCSLL === 'Sim' ? ' e ' : ''}${afetaCSLL === 'Sim' ? 'CSLL' : ''}, 
          acrescidas de juros e multa de mora. Adicionalmente, é crucial implementar uma política 
          interna para a análise e tratamento fiscal de futuras despesas desta natureza.
        </p>
      `;
    } else {
      htmlContent += `
        <p>
          Foi analisado o montante de <strong>${formatCurrencyBR(valorTotal)}</strong> registrado 
          como ${ponto.tema.toLowerCase()}, que foi classificado como despesa dedutível para fins fiscais.
        </p>
        
        <p>
          Com base na análise realizada, o valor atende aos requisitos de necessidade e normalidade 
          estabelecidos pela legislação tributária, sendo apropriada sua dedução da base de cálculo 
          do ${afetaIRPJ === 'Sim' ? 'IRPJ' : ''}${afetaIRPJ === 'Sim' && afetaCSLL === 'Sim' ? ' e ' : ''}${afetaCSLL === 'Sim' ? 'CSLL' : ''}.
        </p>
        
        <p>
          Recomendamos manter a documentação comprobatória adequada e revisar periodicamente 
          os critérios de classificação para garantir conformidade com a legislação vigente.
        </p>
      `;
    }
    
    htmlContent += `
        </div>
      </div>
    `;
  });

  // Conclusão
  htmlContent += `
    <div class="linha-separadora"></div>
    <div class="memorando-conclusao">
      <h4>Conclusão</h4>
      <p>
        Esta carta apresenta os pontos de atenção identificados pela equipe tributária, 
        com recomendações para melhoria dos controles internos relacionados à área fiscal. 
        Reforçamos a importância da avaliação pela administração e do acompanhamento 
        pela auditoria independente.
      </p>
    </div>
  `;

  // Renderizar conteúdo
  container.innerHTML = htmlContent;
}

function configurarExportacao() {
  document.getElementById('btn-exportar-word').onclick = () => abrirModal('word');
  document.getElementById('btn-exportar-ppt').onclick = () => abrirModal('ppt');
}

function abrirModal(tipo) {
  const modal = document.getElementById('modal-preview');
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = document.getElementById('memorando-content').innerHTML;
  modal.style.display = 'flex';

  document.getElementById('modal-close-btn').onclick = fecharModal;
  document.getElementById('modal-cancel-btn').onclick = fecharModal;
  
  if (tipo === 'word') {
    document.getElementById('modal-download-word').onclick = () => exportarWord();
    document.getElementById('modal-download-ppt').style.display = 'none';
    document.getElementById('modal-download-word').style.display = 'flex';
  } else {
    document.getElementById('modal-download-ppt').onclick = () => exportarPowerPoint();
    document.getElementById('modal-download-word').style.display = 'none';
    document.getElementById('modal-download-ppt').style.display = 'flex';
  }

  modal.onclick = (e) => {
    if (e.target === modal) fecharModal();
  };
}

function fecharModal() {
  document.getElementById('modal-preview').style.display = 'none';
}

function exportarWord() {
  const content = document.getElementById('modal-body');
  
  // Preparar HTML otimizado para Word
  const wordHTML = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Memorando de Riscos Fiscais</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>90</w:Zoom>
          <w:DoNotPromptForConvert/>
          <w:DoNotShowRevisions/>
          <w:DoNotPrintRevisions/>
          <w:DoNotShowMarkup/>
          <w:DoNotShowComments/>
          <w:DoNotShowInsertionsAndDeletions/>
          <w:DoNotShowPropertyChanges/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page { 
          margin: 2.5cm 2cm 2.5cm 2cm; 
          mso-header-margin: 1.5cm; 
          mso-footer-margin: 1.5cm; 
        }
        body { 
          font-family: 'Times New Roman', serif; 
          font-size: 12pt; 
          line-height: 1.6; 
          margin: 0; 
          padding: 0;
          color: #000000;
        }
        .memorando-header { 
          text-align: center; 
          margin-bottom: 30pt; 
          padding: 20pt; 
          border: 3pt solid #1D762F;
          border-radius: 10pt;
        }
        .memorando-header h2 { 
          color: #1D762F; 
          font-size: 18pt; 
          font-weight: bold;
          text-transform: uppercase; 
          margin: 0 0 15pt 0; 
          page-break-after: avoid;
        }
        .memorando-header h3 { 
          color: #000000; 
          font-size: 14pt; 
          font-weight: bold;
          text-transform: uppercase; 
          margin: 15pt 0 0 0; 
          page-break-after: avoid;
        }
        .memorando-separador {
          width: 100pt;
          height: 4pt;
          background-color: #1D762F;
          margin: 15pt auto;
        }
        .memorando-destinatario { 
          margin-bottom: 25pt; 
          padding: 20pt; 
          border-left: 6pt solid #1D762F; 
          background-color: #f8f9fa;
        }
        .memorando-destinatario p { 
          margin-bottom: 10pt; 
          font-size: 12pt;
          line-height: 1.5;
        }
        .memorando-destinatario strong { 
          color: #1D762F; 
          font-weight: bold; 
        }
        .documento-confidencial { 
          font-style: italic; 
          color: #856404; 
          background-color: #fff3cd; 
          padding: 12pt; 
          border: 2pt solid #ffc107; 
          margin: 15pt 0;
          text-align: center;
        }
        .linha-separadora {
          height: 3pt;
          background-color: #1D762F;
          margin: 25pt 0;
        }
        .ponto-principal { 
          margin-bottom: 25pt; 
          padding: 20pt; 
          border: 2pt solid #e9ecef; 
          border-left: 6pt solid #1D762F;
          page-break-inside: avoid;
        }
        .ponto-titulo { 
          color: #1D762F; 
          font-size: 14pt; 
          font-weight: bold; 
          margin-bottom: 15pt; 
          text-transform: uppercase;
          border-bottom: 2pt solid #1D762F;
          padding-bottom: 8pt;
          page-break-after: avoid;
        }
        .conteudo-ponto { 
          background-color: #f8f9fa; 
          padding: 15pt; 
          border-left: 6pt solid #1D762F; 
        }
        .conteudo-ponto p { 
          text-align: justify; 
          margin-bottom: 12pt; 
          orphans: 2;
          widows: 2;
          line-height: 1.6;
        }
        .conteudo-ponto strong { 
          color: #1D762F; 
          font-weight: bold; 
        }
        .memorando-conclusao { 
          margin-top: 30pt; 
          padding: 20pt; 
          background-color: #f8f9fa; 
          border: 3pt solid #1D762F; 
          text-align: center;
        }
        .memorando-conclusao h4 { 
          color: #1D762F; 
          font-size: 16pt; 
          font-weight: bold;
          text-transform: uppercase; 
          margin-bottom: 15pt; 
        }
        .memorando-conclusao p { 
          text-align: justify; 
          line-height: 1.6; 
          font-size: 12pt;
        }
        .page-break { 
          page-break-before: always; 
        }
      </style>
    </head>
    <body>
      ${content.innerHTML.replace(/style="[^"]*"/g, '')}
    </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', wordHTML], { 
    type: 'application/msword' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dataAtual = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `Memorando_Riscos_Fiscais_${dataAtual}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  fecharModal();
  
  // Feedback visual
  setTimeout(() => {
    alert('✅ Arquivo Word exportado com sucesso!\n\nO memorando foi salvo como: Memorando_Riscos_Fiscais_' + dataAtual + '.doc');
  }, 500);
}

function exportarPowerPoint() {
  const content = document.getElementById('modal-body');
  
  // Preparar HTML otimizado para PowerPoint
  const pptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <title>Memorando de Riscos Fiscais - Apresentação</title>
      <style>
        body { 
          font-family: 'Calibri', 'Arial', sans-serif; 
          font-size: 16pt; 
          margin: 1.5cm; 
          background: white; 
          line-height: 1.5;
          color: #000000;
        }
        .slide-break { 
          page-break-after: always; 
          padding: 25pt; 
          min-height: 70vh; 
          border-bottom: 3px solid #1D762F;
          margin-bottom: 25pt;
        }
        .slide-break:last-child { 
          page-break-after: avoid; 
          border-bottom: none;
        }
        .memorando-header { 
          text-align: center; 
          margin-bottom: 40pt; 
          padding: 25pt; 
          border: 4pt solid #1D762F;
          background-color: #f8f9fa;
        }
        .memorando-header h2 { 
          color: #1D762F; 
          font-size: 28pt; 
          font-weight: bold;
          margin-bottom: 20pt; 
        }
        .memorando-header h3 { 
          color: #000000; 
          font-size: 20pt; 
          margin-top: 20pt; 
        }
        .memorando-separador {
          width: 120pt;
          height: 5pt;
          background-color: #1D762F;
          margin: 20pt auto;
        }
        .memorando-destinatario { 
          background-color: #f8f9fa; 
          padding: 20pt; 
          border-left: 8pt solid #1D762F;
          margin-bottom: 30pt;
        }
        .memorando-destinatario p { 
          line-height: 1.7; 
          margin-bottom: 15pt; 
          font-size: 16pt;
        }
        .memorando-destinatario strong { 
          color: #1D762F; 
          font-weight: bold; 
        }
        .documento-confidencial { 
          background-color: #fff3cd; 
          padding: 15pt; 
          border-radius: 10pt; 
          border: 3pt solid #ffc107;
          font-style: italic;
          text-align: center;
          margin: 20pt 0;
          color: #856404;
        }
        .linha-separadora {
          height: 4pt;
          background-color: #1D762F;
          margin: 30pt 0;
        }
        .ponto-principal { 
          margin-bottom: 35pt; 
          padding: 25pt; 
          border: 3pt solid #e9ecef; 
          border-left: 8pt solid #1D762F;
          background-color: #ffffff;
        }
        .ponto-titulo { 
          color: #1D762F; 
          font-size: 20pt; 
          font-weight: bold; 
          margin-bottom: 20pt; 
          border-bottom: 3pt solid #1D762F;
          padding-bottom: 10pt;
        }
        .conteudo-ponto { 
          background-color: #f8f9fa; 
          padding: 20pt; 
          border-radius: 10pt; 
          border-left: 6pt solid #1D762F;
        }
        .conteudo-ponto p { 
          line-height: 1.7; 
          margin-bottom: 15pt; 
          text-align: justify;
          font-size: 16pt;
        }
        .conteudo-ponto strong { 
          color: #1D762F; 
          font-weight: bold; 
        }
        .memorando-conclusao {
          background-color: #f8f9fa;
          padding: 25pt;
          border: 4pt solid #1D762F;
          text-align: center;
          margin-top: 35pt;
        }
        .memorando-conclusao h4 {
          color: #1D762F;
          font-size: 22pt;
          font-weight: bold;
          margin-bottom: 20pt;
          text-transform: uppercase;
        }
        .memorando-conclusao p {
          font-size: 18pt;
          line-height: 1.7;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <div class="slide-break">
        ${content.innerHTML.replace(/style="[^"]*"/g, '')}
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', pptHTML], { 
    type: 'application/vnd.ms-powerpoint' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dataAtual = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `Memorando_Riscos_Fiscais_Apresentacao_${dataAtual}.ppt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  fecharModal();
  
  // Feedback visual
  setTimeout(() => {
    alert('✅ Arquivo PowerPoint exportado com sucesso!\n\nA apresentação foi salva como: Memorando_Riscos_Fiscais_Apresentacao_' + dataAtual + '.ppt');
  }, 500);
}

// Função auxiliar para formatação de moeda
function formatCurrencyBR(value) {
  if (value == null || value === '') return '-';
  const numValue = Number(value);
  if (!isNaN(numValue)) {
    return numValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return String(value);
}