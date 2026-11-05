/* Carrinho da vitrine: guarda as escolhas do cliente no navegador e monta o pedido para o WhatsApp. */
(function(){
  const KEY='jf-grifes-carrinho';
  const DEFAULT_MAX=99;
  let items=load();

  function load(){
    try{
      const data=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(data)?data.filter(item=>item&&typeof item.key==='string'&&typeof item.id==='string'&&Number.isInteger(item.qty)&&item.qty>0):[];
    }catch{return []}
  }
  function save(){try{localStorage.setItem(KEY,JSON.stringify(items))}catch{}}
  const lineKey=(id,color,size)=>[id,color||'',size||''].join('|');
  const maxFor=stock=>stock==null?DEFAULT_MAX:stock;
  const countOf=id=>items.filter(item=>item.id===id).reduce((total,item)=>total+item.qty,0);
  const count=()=>items.reduce((total,item)=>total+item.qty,0);
  function total(){return items.every(item=>item.price!=null)?items.reduce((sum,item)=>sum+item.price*item.qty,0):null}

  /* Ações do carrinho */
  function add(product,color,size,qty=1){
    const max=maxFor(product.stock);
    if(countOf(product.id)+qty>max)return {ok:false,message:'Quantidade maior que o estoque disponível.'};
    const key=lineKey(product.id,color,size);
    const line=items.find(item=>item.key===key);
    if(line)line.qty+=qty;
    else items.push({key,id:product.id,name:product.name,price:product.price??null,image:product.image,stock:product.stock??null,color:color||'',size:size||'',qty});
    save();render();
    return {ok:true};
  }
  function changeQty(key,delta){
    const line=items.find(item=>item.key===key);if(!line)return;
    const next=line.qty+delta;
    if(next<=0)return removeLine(key);
    if(countOf(line.id)+delta>maxFor(line.stock))return;
    line.qty=next;save();render();
  }
  function removeLine(key){items=items.filter(item=>item.key!==key);save();render()}
  /* Atualiza os itens com os dados atuais do catálogo (preço, estoque, cores e tamanhos). */
  function sync(products){
    if(!Array.isArray(products))return;
    items=items.flatMap(item=>{
      const product=products.find(p=>p.id===item.id);
      if(!product)return [];
      if(item.color&&!(product.colors||[]).includes(item.color))return [];
      if(item.size&&!(product.sizes||[]).includes(item.size))return [];
      if(product.stock===0)return [];
      Object.assign(item,{name:product.name,price:product.price??null,image:product.image,stock:product.stock??null});
      return [item];
    });
    for(const product of products){
      if(product.stock==null)continue;
      let excess=countOf(product.id)-product.stock;
      for(const item of items.filter(i=>i.id===product.id).reverse()){
        if(excess<=0)break;
        const cut=Math.min(excess,item.qty);item.qty-=cut;excess-=cut;
      }
      items=items.filter(item=>item.qty>0);
    }
    save();render();
  }

  /* Pedido para o WhatsApp */
  function checkoutMessage(){
    const lines=items.map((item,index)=>{
      const options=[item.color&&`Cor: ${item.color}`,item.size&&`Tamanho: ${item.size}`].filter(Boolean);
      const price=item.price==null?'Consulte o preço':money(item.price*item.qty);
      return `${index+1}. ${item.name}${options.length?` (${options.join(', ')})`:''} — Qtd: ${item.qty} — ${price}`;
    });
    const sum=total();
    return ['Olá! Vim pelo site da JF Grifes e gostaria de finalizar o meu pedido:','',...lines,'',sum==null?'Total: a confirmar com a loja':`Total: ${money(sum)}`].join('\n');
  }
  function checkout(){
    const phone=(typeof STORE_WHATSAPP==='string'?STORE_WHATSAPP:'').replace(/\D/g,'');
    if(!items.length)return;
    if(phone.length<12){alert('Configure o número de WhatsApp da loja no arquivo script.js para habilitar este botão.');return}
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(checkoutMessage())}`,'_blank','noopener,noreferrer');
  }

  /* Interface do carrinho */
  const toggle=document.createElement('button');
  toggle.type='button';toggle.className='cart-toggle';toggle.setAttribute('aria-controls','cart-drawer');toggle.setAttribute('aria-haspopup','dialog');
  toggle.innerHTML='CARRINHO <span class="cart-count" aria-live="polite">0</span>';
  const drawer=document.createElement('div');
  drawer.id='cart-drawer';drawer.className='cart-drawer';drawer.hidden=true;
  drawer.innerHTML=`<div class="cart-overlay" data-close></div>
    <section class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <header class="cart-head"><h2 id="cart-title">Seu carrinho</h2><button type="button" class="cart-close" data-close aria-label="Fechar carrinho">×</button></header>
      <div class="cart-body"><p class="cart-empty">Seu carrinho está vazio. Escolha uma peça para começar.</p><div class="cart-list"></div></div>
      <footer class="cart-foot"><p class="cart-total"></p><p class="cart-note">Ao enviar, o pedido abre no WhatsApp da loja com todos os itens para você finalizar a compra.</p><button type="button" class="cart-checkout primary">ENVIAR PEDIDO PELO WHATSAPP</button></footer>
    </section>`;
  const $=selector=>drawer.querySelector(selector);
  const list=$('.cart-list'),empty=$('.cart-empty'),totalText=$('.cart-total'),checkoutButton=$('.cart-checkout');
  const header=document.querySelector('.nav-inner');
  const menu=header?.querySelector('.menu-toggle');
  if(header)header.insertBefore(toggle,menu||null);
  document.body.append(drawer);

  function open(){drawer.hidden=false;document.body.classList.add('cart-open');$('.cart-close').focus()}
  function close(){drawer.hidden=true;document.body.classList.remove('cart-open');toggle.focus()}
  toggle.addEventListener('click',open);
  drawer.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!drawer.hidden)close()});
  checkoutButton.addEventListener('click',checkout);

  function button(text,label,onClick){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.addEventListener('click',onClick);return b}
  function render(){
    const n=count();
    toggle.querySelector('.cart-count').textContent=n;
    toggle.setAttribute('aria-label',`Carrinho, ${n} ${n===1?'item':'itens'}`);
    list.replaceChildren();
    empty.hidden=items.length>0;
    checkoutButton.disabled=items.length===0;
    if(!items.length){totalText.textContent='';return}
    for(const item of items){
      const row=document.createElement('article');row.className='cart-item';
      const img=document.createElement('img');img.src=safeImage(item.image);img.alt='';
      const info=document.createElement('div');info.className='cart-item-info';
      const title=document.createElement('strong');title.textContent=item.name;
      const options=document.createElement('small');options.textContent=[item.color&&`Cor: ${item.color}`,item.size&&`Tamanho: ${item.size}`].filter(Boolean).join(' · ');
      const price=document.createElement('span');price.className='cart-item-price';price.textContent=item.price==null?'Consulte o preço':money(item.price*item.qty);
      const qty=document.createElement('div');qty.className='cart-qty';
      const amount=document.createElement('span');amount.textContent=item.qty;
      qty.append(button('−',`Diminuir ${item.name}`,()=>changeQty(item.key,-1)),amount,button('+',`Aumentar ${item.name}`,()=>changeQty(item.key,1)));
      const remove=button('Remover',`Remover ${item.name} do carrinho`,()=>removeLine(item.key));remove.className='cart-remove';
      info.append(title,options,price,qty,remove);
      row.append(img,info);list.append(row);
    }
    const sum=total();
    totalText.textContent=sum==null?'Total: a confirmar com a loja':`Total: ${money(sum)}`;
  }

  /* Janela do produto: ao clicar no produto da vitrine, o cliente escolhe cor e tamanho e adiciona ao carrinho. */
  const modal=document.createElement('dialog');
  modal.className='product-modal';
  modal.innerHTML=`<button type="button" class="pm-close" aria-label="Fechar">×</button>
    <div class="pm-layout">
      <img class="pm-image" alt="">
      <div class="pm-info">
        <small class="pm-cat"></small>
        <h3 class="pm-name"></h3>
        <p class="pm-price"></p>
        <p class="pm-stock"></p>
        <p class="pm-desc"></p>
        <div class="pm-fields"></div>
        <button type="button" class="add-to-cart pm-add">ADICIONAR AO CARRINHO</button>
        <p class="cart-feedback pm-feedback" role="status"></p>
      </div>
    </div>`;
  document.body.append(modal);
  const mq=selector=>modal.querySelector(selector);
  mq('.pm-close').addEventListener('click',()=>modal.close());
  modal.addEventListener('click',event=>{if(event.target===modal)modal.close()});

  function openProduct(product){
    const image=mq('.pm-image');image.src=safeImage(product.image);image.alt=product.name;
    mq('.pm-cat').textContent=product.category||'';
    mq('.pm-name').textContent=product.name;
    mq('.pm-price').textContent=money(product.price);
    mq('.pm-stock').textContent=product.stock==null?'Disponibilidade sob consulta':product.stock===1?'1 unidade disponível':`${product.stock} unidades disponíveis`;
    mq('.pm-desc').textContent=product.description||'';
    mq('.pm-desc').hidden=!product.description;
    const fields=mq('.pm-fields');fields.replaceChildren();
    const selects={};
    for(const [key,label,values] of [['color','Cor',product.colors],['size','Tamanho',product.sizes]]){
      if(!Array.isArray(values)||!values.length)continue;
      const field=document.createElement('label');field.className='variant-field';
      const text=document.createElement('span');text.textContent=label;
      const select=document.createElement('select');select.setAttribute('aria-label',`${label} de ${product.name}`);
      select.append(new Option(`Escolha a ${label.toLowerCase()}`,''));
      for(const value of values)select.append(new Option(value,value));
      field.append(text,select);fields.append(field);selects[key]=select;
    }
    const feedback=mq('.pm-feedback');feedback.textContent='';
    const addButton=mq('.pm-add');
    addButton.onclick=()=>{
      const color=selects.color?.value||'',size=selects.size?.value||'';
      if(selects.color&&!color||selects.size&&!size){feedback.textContent='Escolha '+[selects.color&&!color&&'a cor',selects.size&&!size&&'o tamanho'].filter(Boolean).join(' e ')+' antes de adicionar.';return}
      const result=add(product,color,size);
      if(!result.ok){feedback.textContent=result.message;return}
      modal.close();
      open();
    };
    modal.showModal();
  }

  /* Botão exibido em cada produto disponível da vitrine */
  function productAction(product){
    const button=document.createElement('button');
    button.type='button';button.className='add-to-cart';
    button.textContent='ESCOLHER E ADICIONAR';
    button.setAttribute('aria-label',`Escolher e adicionar ao carrinho: ${product.name}`);
    button.addEventListener('click',()=>openProduct(product));
    return button;
  }

  window.JFCart={productAction,sync,open};
  render();
})();
