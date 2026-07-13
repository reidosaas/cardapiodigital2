export function printPedido(pedido: any) {
  const w = window.open('', '_blank');
  if (!w) return;

  const corPrimaria = '#6C63FF';
  const itens = pedido.itens || [];
  const statusLabel: Record<string, string> = {
    PENDENTE: 'PENDENTE', CONFIRMADO: 'CONFIRMADO', PREPARANDO: 'PREPARANDO',
    SAIU_PARA_ENTREGA: 'SAIU P/ ENTREGA', ENTREGUE: 'ENTREGUE', CANCELADO: 'CANCELADO',
  };

  w.document.write(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">    <title>Pedido #${pedido.codigo ? String(pedido.codigo).padStart(8, '0') : pedido.id.slice(0, 8)}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    padding: 8px;
    color: #000;
  }
  .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
  .header h1 { font-size: 18px; font-weight: bold; }
  .header .status { font-size: 14px; font-weight: bold; margin-top: 4px; }
  .info { margin-bottom: 8px; }
  .info p { line-height: 1.6; }
  .info .label { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 4px 0; }
  th { border-bottom: 1px solid #000; }
  td.qty { width: 30px; text-align: center; }
  td.name { }
  td.price { width: 70px; text-align: right; }
  .total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 6px; }
  .footer { text-align: center; margin-top: 12px; font-size: 10px; border-top: 2px dashed #000; padding-top: 8px; }
  .obs { margin-top: 6px; font-style: italic; font-size: 11px; }
  @media print {
    body { width: 100%; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${pedido.nomeLoja || 'PEDIDO'}</h1>
    <div class="status">#${pedido.codigo ? String(pedido.codigo).padStart(8, '0') : pedido.id.slice(0, 8)} - ${statusLabel[pedido.status] || pedido.status}</div>
  </div>

  <div class="info">
    <p><span class="label">Cliente:</span> ${pedido.clienteNome || 'N/A'}</p>
    ${pedido.clienteTelefone ? `<p><span class="label">Tel:</span> ${pedido.clienteTelefone}</p>` : ''}
    <p><span class="label">Tipo:</span> ${pedido.tipoEntrega === 'ENTREGA' ? 'Entrega' : 'Retirada'}</p>
    ${pedido.tipoEntrega === 'ENTREGA' && pedido.enderecoEntrega ? `
    <p style="margin-top:4px;padding:6px;border:1px solid #000;font-weight:bold;font-size:13px;background:#f5f5f5;">
      🏠 ${pedido.enderecoEntrega}
    </p>` : ''}
    ${pedido.observacao ? `<p class="obs">Obs: ${pedido.observacao}</p>` : ''}
    <p><span class="label">Data:</span> ${new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
  </div>

  <div class="divider"></div>

  <table>
    <thead><tr><th class="qty">Qtd</th><th class="name">Item</th><th class="price">Total</th></tr></thead>
    <tbody>
      ${itens.map((i: any) => `
        <tr>
          <td class="qty">${i.quantidade}x</td>
          <td class="name">${i.nome}${i.observacao ? `\n(${i.observacao})` : ''}</td>
          <td class="price">R$ ${Number(i.total).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="divider"></div>

  <table>
    <tr><td>Subtotal</td><td style="text-align:right">R$ ${Number(pedido.total).toFixed(2)}</td></tr>
    ${pedido.taxaEntrega && Number(pedido.taxaEntrega) > 0 ? `<tr><td>Taxa Entrega</td><td style="text-align:right">R$ ${Number(pedido.taxaEntrega).toFixed(2)}</td></tr>` : ''}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">R$ ${(Number(pedido.total) + Number(pedido.taxaEntrega || 0)).toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    <p>Obrigado pela preferencia!</p>
    <p style="margin-top:4px;font-size:9px;">${new Date().toLocaleString('pt-BR')}</p>
  </div>

  <div class="no-print" style="text-align:center;margin-top:16px;">
    <button onclick="window.print()" style="padding:10px 30px;font-size:16px;background:${corPrimaria};color:#fff;border:none;border-radius:8px;cursor:pointer;">
      Imprimir
    </button>
    <button onclick="window.close()" style="padding:10px 30px;font-size:16px;background:#ccc;color:#000;border:none;border-radius:8px;cursor:pointer;margin-left:8px;">
      Fechar
    </button>
  </div>

  <script>
    setTimeout(function() {
      var btn = document.querySelector('.no-print button');
      if (btn) btn.click();
    }, 500);
  </script>
</body>
</html>`);
  w.document.close();
}