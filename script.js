let produtos = JSON.parse(localStorage.getItem('erp_produtos')) || [];
let vendas = JSON.parse(localStorage.getItem('erp_vendas')) || []; // Reservado para integração PDV

// 2. Controle de Navegação
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.style.display = 'none');
    const ativa = document.getElementById(id);
    if (ativa) {
        ativa.style.display = 'block';
        // Gatilhos de atualização específica
        if (id === 'dashboard') atualizarDashboard();
        if (id === 'produtos') renderizarTabelaProdutos(produtos);
        if (id === 'estoque') renderizarEstoqueAvancado();
        if (id === 'vendas') renderizarRelatorioVendas();
    }
}

// 3. Gestão de Produtos (CRUD)
function salvarProduto() {
    const id = document.getElementById('pId').value;
    const codBarras = document.getElementById('pCodBarras').value.trim(); // NOVO
    const nome = document.getElementById('pNome').value.trim();
    const custo = parseFloat(document.getElementById('pCusto').value) || 0;
    const venda = parseFloat(document.getElementById('pVenda').value) || 0;
    const estoque = parseInt(document.getElementById('pEstoque').value) || 0;

    if (!nome) return alert("Nome do produto é obrigatório!");

    if (id) {
        const index = produtos.findIndex(p => p.id == id);
        // Mantemos o ID original e atualizamos o restante
        produtos[index] = { id: parseInt(id), codBarras, nome, custo, venda, estoque };
    } else {
        // Novo Produto
        produtos.push({ 
            id: Date.now(), 
            codBarras: codBarras || "S/N", // Se não digitar, salva Sem Número
            nome, 
            custo, 
            venda, 
            estoque 
        });
    }

    sincronizar();
    limparFormulario();
}

// Atualize a renderização da tabela para mostrar o EAN
function renderizarTabelaProdutos(lista) {
    const tbody = document.getElementById('listaProdutos');
    if (!tbody) return;
    tbody.innerHTML = '';

    lista.forEach(p => {
        const margem = p.custo > 0 ? (((p.venda - p.custo) / p.custo) * 100).toFixed(1) : 0;
        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #ddd; text-align: center;">
                <td style="padding: 10px; font-size: 0.85em; color: #666;">${p.codBarras}</td>
                <td style="text-align: left;">${p.nome}</td>
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

// Atualize o limparFormulario
function limparFormulario() {
    document.getElementById('pId').value = '';
    document.getElementById('pCodBarras').value = ''; // NOVO
    document.getElementById('pNome').value = '';
    document.getElementById('pCusto').value = '';
    document.getElementById('pVenda').value = '';
    document.getElementById('pEstoque').value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Produto";
    document.getElementById('btnCancelar').style.display = 'none';
}

// Atualize o editarProduto
function editarProduto(id) {
    const p = produtos.find(p => p.id == id);
    if (p) {
        document.getElementById('pId').value = p.id;
        document.getElementById('pCodBarras').value = p.codBarras || ''; // NOVO
        document.getElementById('pNome').value = p.nome;
        document.getElementById('pCusto').value = p.custo;
        document.getElementById('pVenda').value = p.venda;
        document.getElementById('pEstoque').value = p.estoque;
        document.getElementById('btnSalvar').innerText = "Atualizar Produto";
        document.getElementById('btnCancelar').style.display = 'inline-block';
        window.scrollTo(0,0);
    }
}

// Atualize o filtro para buscar também pelo Código de Barras
function filtrarProdutos(termo) {
    const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo.toLowerCase()) || 
        (p.codBarras && p.codBarras.includes(termo)) ||
        p.id.toString().includes(termo)
    );
    renderizarTabelaProdutos(filtrados);
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

// 4. Filtros e Busca (O "Pulo do Gato" do ERP)
function filtrarProdutos(termo) {
    const filtrados = produtos.filter(p => 
        p.nome.toLowerCase().includes(termo.toLowerCase()) || 
        p.id.toString().includes(termo)
    );
    renderizarTabelaProdutos(filtrados);
}

// 5. Módulo de Estoque Avançado
function renderizarEstoqueAvancado() {
    // Pegamos a div interna, preservando o Header da Section
    const container = document.getElementById('estoque-content'); 
    if (!container) return;

    const itensCriticos = produtos.filter(p => p.estoque < 5);
    const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.custo * p.estoque), 0);

    // Injeta APENAS no conteúdo, sem apagar o botão de imprimir lá do topo
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

function limparFormulario() {
    document.getElementById('pId').value = '';
    document.getElementById('pNome').value = '';
    document.getElementById('pCusto').value = '';
    document.getElementById('pVenda').value = '';
    document.getElementById('pEstoque').value = '';
    document.getElementById('btnSalvar').innerText = "Salvar Produto";
    document.getElementById('btnCancelar').style.display = 'none';
}

function editarProduto(id) {
    const p = produtos.find(p => p.id == id);
    if (p) {
        document.getElementById('pId').value = p.id;
        document.getElementById('pNome').value = p.nome;
        document.getElementById('pCusto').value = p.custo;
        document.getElementById('pVenda').value = p.venda;
        document.getElementById('pEstoque').value = p.estoque;
        document.getElementById('btnSalvar').innerText = "Atualizar Produto";
        document.getElementById('btnCancelar').style.display = 'inline-block';
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

function exportarCSV() {
    // Adicionamos o BOM (Byte Order Mark) para o Excel reconhecer caracteres especiais (acentos)
    let csv = "\uFEFF"; 
    csv += "Código;Descrição;Custo;Venda;Estoque;Margem\n";
    
    produtos.forEach(p => {
        const margem = p.custo > 0 ? (((p.venda - p.custo) / p.custo) * 100).toFixed(2) : 0;
        // Substituímos a vírgula por ponto e vírgula para as colunas
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
    janelaImpressao.document.write('<link rel="stySlesheet" href="style.css">'); // Carrega seu CSS
    janelaImpressao.document.write('</head><body>');
    janelaImpressao.document.write(conteudo);
    janelaImpressao.document.write('</body></html>');
    janelaImpressao.document.close();
    janelaImpressao.print();
}

window.onload = () => showSection('dashboard');
