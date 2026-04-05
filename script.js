let produtos = JSON.parse(localStorage.getItem('erp_produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('erp_vendas')) || []; 

// 2. Controle de Navegação
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const ativa = document.getElementById(id);
    if (ativa) {
        ativa.style.display = 'block';
        if (id === 'dashboard') atualizarDashboard();
        if (id === 'produtos') renderizarTabelaProdutos(produtos);
        if (id === 'estoque') renderizarEstoqueAvancado();
        if (id === 'vendas') renderizarRelatorioVendas();
    }
}

// 3. Gestão de Produtos (CRUD)
function salvarProduto() {
    const id = document.getElementById('pId').value;
    const codBarras = document.getElementById('pCodBarras').value.trim(); 
    const nome = document.getElementById('pNome').value.trim();
    const custo = parseFloat(document.getElementById('pCusto').value) || 0;
    const venda = parseFloat(document.getElementById('pVenda').value) || 0;
    const estoque = parseInt(document.getElementById('pEstoque').value) || 0;

    if (!nome) return alert("Nome do produto é obrigatório!");

    if (id) {
        const index = produtos.findIndex(p => p.id == id);
        produtos[index] = { id: parseInt(id), codBarras, nome, custo, venda, estoque };
    } else {
        produtos.push({ 
            id: Date.now(), 
            codBarras: codBarras || "S/N", 
            nome, 
            custo, 
            venda, 
            estoque 
        });
    }

    sincronizar();
    limparFormulario();
}

function renderizarTabelaProdutos(lista) {
    const tbody = document.getElementById('listaProdutos');
    if (!tbody) return;
    tbody.innerHTML = '';

    lista.forEach(p => {
        const margem = p.custo > 0 ? (((p.venda - p.custo) / p.custo) * 100).toFixed(1) : 0;
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #ddd; text-align: center;">
                <td style="padding: 10px;">#${p.id}</td>
                <td>${p.nome}</td>
                <td>R$ ${p.custo.toFixed(2)}</td>
                <td>R$ ${p.venda.toFixed(2)}</td>
                <td style="font-weight: bold; color: ${p.estoque < 5 ? '#e74c3c' : '#27ae60'}">${p.estoque}</td>
                <td>${margem}%</td>
                <td>
                    <button onclick="editarProduto(${p.id})">✏️</button>
                    <button onclick="excluirProduto(${p.id})">🗑️</button>
                </td>
            </tr>`;
    });
}

function limparFormulario() {
    document.getElementById('pId').value = '';
    const cb = document.getElementById('pCodBarras');
    if(cb) cb.value = '';
    document.getElementById('pNome').value = '';
    document.getElementById('pCusto').value = '';
    document.getElementById('pVenda').value = '';
    document.getElementById('pEstoque').value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Produto";
    const btnC = document.getElementById('btnCancelar');
    if(btnC) btnC.style.display = 'none';
}

function editarProduto(id) {
    const p = produtos.find(p => p.id == id);
    if (p) {
        document.getElementById('pId').value = p.id;
        const cb = document.getElementById('pCodBarras');
        if(cb) cb.value = p.codBarras || '';
        document.getElementById('pNome').value = p.nome;
        document.getElementById('pCusto').value = p.custo;
        document.getElementById('pVenda').value = p.venda;
        document.getElementById('pEstoque').value = p.estoque;
        document.getElementById('btnSalvar').innerText = "Atualizar Produto";
        const btnC = document.getElementById('btnCancelar');
        if(btnC) btnC.style.display = 'inline-block';
        window.scrollTo(0,0);
    }
}

function excluirProduto(id) {
    if(confirm("Deseja excluir permanentemente?")) {
        produtos = produtos.filter(p => p.id !== id);
        sincronizar();
        renderizarTabelaProdutos(produtos);
    }
}

function filtrarProdutos(termo) {
    const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo.toLowerCase()) || 
        p.id.toString().includes(termo) ||
        (p.codBarras && p.codBarras.includes(termo))
    );
    renderizarTabelaProdutos(filtrados);
}

// 5. Módulo de Estoque Avançado
function renderizarEstoqueAvancado() {
    const container = document.getElementById('estoque-content'); 
    if (!container) return;

    const itensCriticos = produtos.filter(p => p.estoque < 5);
    const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.custo * p.estoque), 0);

    container.innerHTML = `
        <div class="card" style="margin-bottom:20px; background:#fff; padding:20px; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3>Resumo de Inventário</h3>
            <div style="display: flex; gap: 40px; margin-top: 10px;">
                <p>Valor total (Custo): <strong>R$ ${valorTotalEstoque.toFixed(2)}</strong></p>
                <p>Itens Críticos: <strong style="color:red">${itensCriticos.length}</strong></p>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
                <tr style="background: #34495e; color: white;">
                    <th style="padding:12px">Produto</th>
                    <th>Qtd Atual</th>
                    <th>Sugestão de Compra</th>
                </tr>
            </thead>
            <tbody>
                ${itensCriticos.length > 0 ? itensCriticos.map(p => `
                    <tr style="border-bottom: 1px solid #ddd; text-align:center;">
                        <td style="padding:10px">${p.nome}</td>
                        <td style="color:red; font-weight:bold">${p.estoque}</td>
                        <td>${10 - p.estoque} unidades</td>
                    </tr>
                `).join('') : '<tr><td colspan="3" style="padding:20px; text-align:center;">Nenhum item com estoque baixo.</td></tr>'}
            </tbody>
        </table>
    `;
}

// 6. Funções de Dashboard e Auxiliares
function atualizarDashboard() {
    const totalPatrimonio = produtos.reduce((acc, p) => acc + (p.custo * p.estoque), 0);
    const totalAlertas = produtos.filter(p => p.estoque < 5).length;
    
    document.getElementById('dashPatrimonio').innerText = `R$ ${totalPatrimonio.toFixed(2)}`;
    document.getElementById('dashAlertas').innerText = totalAlertas;
    document.getElementById('dashTotalItens').innerText = produtos.length;
}

function sincronizar() {
    localStorage.setItem('erp_produtos', JSON.stringify(produtos));
    atualizarDashboard();
}

function exportarCSV() {
    let csv = "\uFEFF"; 
    csv += "Código;Descrição;Custo;Venda;Estoque;Margem\n";
    produtos.forEach(p => {
        const margem = p.custo > 0 ? (((p.venda - p.custo) / p.custo) * 100).toFixed(2) : 0;
        csv += `${p.id};${p.nome};${p.custo};${p.venda};${p.estoque};${margem}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toLocaleDateString()}.csv`;
    a.click();
}

function imprimirRelatorio() {
    const conteudo = document.getElementById('estoque').innerHTML;
    const janelaImpressao = window.open('', '', 'height=600,width=800');
    janelaImpressao.document.write('<html><head><title>Relatório de Estoque - VisualSystem</title>');
    janelaImpressao.document.write('<link rel="stylesheet" href="style.css">');
    janelaImpressao.document.write('</head><body>');
    janelaImpressao.document.write(conteudo);
    janelaImpressao.document.write('</body></html>');
    janelaImpressao.document.close();
    janelaImpressao.print();
}

// 7. Relatório de Vendas e Detalhes (Cupom)
function renderizarRelatorioVendas(listaParaExibir = vendas) {
    const tbody = document.getElementById('listaVendasRealizadas');
    if (!tbody) return;

    // 1. LIMPEZA INICIAL: Isso garante que não existam linhas "fantasmas" ou duplicadas
    tbody.innerHTML = '';

    // 2. VERIFICAÇÃO DE DADOS
    if (listaParaExibir.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; color: #999; text-align: center;">
                    Nenhuma venda encontrada para os critérios selecionados.
                </td>
            </tr>`;
        const faturamentoEl = document.getElementById('faturamentoTotal');
        if(faturamentoEl) faturamentoEl.innerText = "R$ 0,00";
        return;
    }

    // 3. ORDENAÇÃO: Mais recentes no topo
    listaParaExibir.sort((a, b) => b.timestamp - a.timestamp);

    // 4. CONSTRUÇÃO DA TABELA (Apenas os Cupons, sem textos extras)
    listaParaExibir.forEach(v => {
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee; text-align: center;">
                <td style="padding: 12px; font-weight: bold; color: #666;">#${v.id.toString().slice(-6)}</td>
                <td>${v.data} <small style="color:#888">${v.hora}</small></td>
                <td>${v.itens.length} itens</td>
                <td style="font-weight: bold; color: #27ae60;">R$ ${v.total.toFixed(2)}</td>
                <td>
                    <button onclick="verDetalhesVenda(${v.id})" style="cursor:pointer; background:none; border:none; color: var(--primary-dark);">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>`;
    });

    // 5. ATUALIZAÇÃO DO CARD DE FATURAMENTO (O resumo oficial)
    const total = listaParaExibir.reduce((acc, v) => acc + v.total, 0);
    const faturamentoEl = document.getElementById('faturamentoTotal');
    if (faturamentoEl) {
        faturamentoEl.innerText = `R$ ${total.toFixed(2)}`;
    }
}

// FUNÇÃO QUE GERA O DOCUMENTO PARA IMPRESSÃO DO CUPOM
function verDetalhesVenda(idVenda) {
    const venda = vendas.find(v => v.id == idVenda);
    if (!venda) return;

    const container = document.getElementById('conteudoCupom');
    if (!container) return;

    let itensHtml = venda.itens.map(item => `
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
            <span>${item.qtd}x ${item.nome}</span>
            <span>R$ ${item.preco.toFixed(2)}</span>
        </div>`).join('');

    container.innerHTML = `
        <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:10px; margin-bottom:10px;">
            <h3 style="margin:0;">VISUAL SYSTEM - CUPOM</h3>
            <p style="font-size:12px; margin:5px 0;">${venda.data} - ${venda.hora}</p>
            <p style="font-size:12px; margin:0;">ID TRANS.: #${venda.id}</p>
        </div>
        <div style="margin-bottom:10px;">
            ${itensHtml}
        </div>
        <div style="border-top:1px dashed #000; padding-top:10px; display:flex; justify-content:space-between; font-weight:bold;">
            <span>TOTAL:</span>
            <span>R$ ${venda.total.toFixed(2)}</span>
        </div>
        <div style="text-align:center; margin-top:15px; font-size:12px; color:#444;">
            <p>Pagamento: ${venda.metodoPagamento || 'Dinheiro'}</p>
        </div>
    `;

    const modal = document.getElementById('modalVenda');
    if(modal) modal.style.display = 'block';
}

function simularVendaPDV() {
    if (produtos.length < 2) {
        alert("Cadastre os produtos primeiro!");
        return;
    }

    const agora = new Date();
    const novaVenda = {
        id: Date.now(),
        timestamp: agora.getTime(),
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: [
            { id: produtos[0].id, nome: produtos[0].nome, preco: produtos[0].venda, custo: produtos[0].custo, qtd: 1 },
            { id: produtos[1].id, nome: produtos[1].nome, preco: produtos[1].venda, custo: produtos[1].custo, qtd: 1 }
        ],
        total: produtos[0].venda + produtos[1].venda,
        lucro: (produtos[0].venda - produtos[0].custo) + (produtos[1].venda - produtos[1].custo),
        metodoPagamento: "Dinheiro"
    };

    vendas.push(novaVenda);
    localStorage.setItem('erp_vendas', JSON.stringify(vendas));
    
    produtos[0].estoque -= 1;
    produtos[1].estoque -= 1;
    
    sincronizar();
    alert("Cupom #" + novaVenda.id + " gerado!");
    renderizarRelatorioVendas();
}

function fecharModal() {
    const modal = document.getElementById('modalVenda');
    if (modal) {
        modal.style.display = 'none';
    }
}

function aplicarFiltrosVendas() {
    const dataInicio = document.getElementById('filtroDataInicio').value; // Vem como 2024-04-04
    const dataFim = document.getElementById('filtroDataFim').value;
    const termoBusca = document.getElementById('buscaVendaId').value.trim();

    let vendasFiltradas = vendas.filter(v => {
        // 1. Converter a data salva (DD/MM/AAAA) para o formato do input (AAAA-MM-DD)
        const partes = v.data.split('/');
        const dataVendaISO = `${partes[2]}-${partes[1]}-${partes[0]}`;

        // 2. Lógica de comparação de datas
        if (dataInicio && dataVendaISO < dataInicio) return false;
        if (dataFim && dataVendaISO > dataFim) return false;

        // 3. Lógica de busca por ID (parcial)
        if (termoBusca && !v.id.toString().includes(termoBusca)) return false;

        return true;
    });

    renderizarRelatorioVendas(vendasFiltradas);
}

// 2. Função para Resetar os Filtros
function limparFiltrosVendas() {
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';
    document.getElementById('buscaVendaId').value = '';
    renderizarRelatorioVendas(vendas);
}

// 3. Ajuste na Função de Renderização (Importante!)
// Altere o início da sua função renderizarRelatorioVendas para aceitar a lista filtrada
function renderizarRelatorioVendas(listaParaExibir = vendas) {
    const tbody = document.getElementById('listaVendasRealizadas');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    // Se não houver nada após o filtro
    if (listaParaExibir.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 30px; color: #999; text-align: center;">
                    <i class="fas fa-search" style="display:block; font-size: 2rem; margin-bottom: 10px;"></i>
                    Nenhuma venda encontrada com estes filtros.
                </td>
            </tr>`;
        atualizarTotalizadorFiltro(0);
        return;
    }

    // Ordenação (Mais recente primeiro)
    listaParaExibir.sort((a, b) => b.timestamp - a.timestamp);

    listaParaExibir.forEach(v => {
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #eee; text-align: center;">
                <td style="padding: 12px; font-weight: bold; color: #666;">#${v.id.toString().slice(-6)}</td>
                <td>${v.data} <small style="color:#888">${v.hora}</small></td>
                <td>${v.itens.length} itens</td>
                <td style="font-weight: bold; color: #27ae60;">R$ ${v.total.toFixed(2)}</td>
                <td>
                    <button onclick="verDetalhesVenda(${v.id})" style="cursor:pointer; background:none; border:none; color: #2c3e50;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>`;
    });

    atualizarTotalizadorFiltro(listaParaExibir.reduce((acc, v) => acc + v.total, 0));
}

function atualizarTotalizadorFiltro(valor) {
    const faturamentoEl = document.getElementById('faturamentoTotal');
    if (faturamentoEl) faturamentoEl.innerText = `R$ ${valor.toFixed(2)}`;
}


window.onload = () => showSection('dashboard');
