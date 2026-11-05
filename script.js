/* Altere o número abaixo pelo WhatsApp real da loja (DDI 55 + DDD + número). */
const STORE_WHATSAPP = '';
const message = 'Olá! Vim pelo site da JF Grifes e gostaria de conhecer as peças disponíveis.';
for (const link of document.querySelectorAll('.whatsapp-link')) {
  if (STORE_WHATSAPP.replace(/\D/g, '').length >= 12) {
    link.href = `https://wa.me/${STORE_WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    link.target = '_blank';link.rel='noopener noreferrer';
  } else {
    link.addEventListener('click', (event) => { event.preventDefault(); alert('Configure o número de WhatsApp da loja no arquivo script.js para habilitar este botão.'); });
  }
}
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-nav');
menuButton.addEventListener('click', () => {
  const opened = mobileMenu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.setAttribute('aria-label', opened ? 'Fechar menu' : 'Abrir menu');
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click',()=>{mobileMenu.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}));
const productButton=document.querySelector('.nav-dropdown-trigger');
productButton.addEventListener('click',()=>{const open=productButton.parentElement.classList.toggle('open');productButton.setAttribute('aria-expanded',String(open))});

const iconPaths = {
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  instagram:'<rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
  tag:'<path d="M3 12V4h8l10 10-7 7L3 12Z"/><circle cx="8" cy="8" r="1"/>',
  diamond:'<path d="M6 3h12l4 6-10 12L2 9l4-6Zm-4 6h20M9 3 7 9l5 12 5-12-2-6"/>',
  headset:'<path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13v5h4v-6H3Zm14-1v6h4v-5h-4ZM17 19c-1 2-3 2-5 2"/>'
};
function svgIcon(name){if(name==='whatsapp')return '<img class="ui-icon whatsapp-icon" src="assets/whatsapp.svg" alt="" aria-hidden="true">';return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]}</svg>`}
document.querySelectorAll('.section-heading>a span,.category-overlay>b,.btn span:last-child,.outline-btn span,.light-outline span').forEach(el=>{el.innerHTML=svgIcon('arrow')});
document.querySelectorAll('.chev').forEach(el=>{el.innerHTML=svgIcon('chevron')});
document.querySelectorAll('.mini-promo-title b,.side-product-label b').forEach(el=>{el.innerHTML='VER SELEÇÃO '+svgIcon('arrow')});
document.querySelectorAll('.wa-icon,.large-cta span:first-child').forEach(el=>{el.innerHTML=svgIcon('whatsapp')});
document.querySelectorAll('.benefit-icon').forEach((el,i)=>{el.innerHTML=svgIcon(['tag','diamond','headset'][i])});
document.querySelectorAll('.footer-contact b').forEach((el,i)=>{el.innerHTML=svgIcon(['pin','instagram'][i])});
document.querySelectorAll('.footer-links a').forEach(el=>{if(el.classList.contains('whatsapp-link')){const label=el.textContent.includes('WhatsApp')?'WhatsApp':el.textContent.includes('Contato')?'Contato':'Dúvidas sobre trocas';el.innerHTML=svgIcon(label==='WhatsApp'?'whatsapp':label==='Contato'?'mail':'tag')+' '+label}});

const grid=document.getElementById('catalog-grid');
const search=document.getElementById('product-search');
let currentFilter=document.body.dataset.category||'Todos';
let catalogProducts=[];
function renderCatalog(){
  if(!grid)return;
  const query=(search.value||'').trim().toLocaleLowerCase('pt-BR');
  const products=catalogProducts.filter(item=>(currentFilter==='Todos'||item.category===currentFilter)&&(!query||`${item.name} ${item.description||''} ${item.category}`.toLocaleLowerCase('pt-BR').includes(query)));
  grid.replaceChildren();
  for(const item of products){
    const card=document.createElement('article');card.className='catalog-card';
    const media=document.createElement('div');media.className='catalog-media';
    const img=document.createElement('img');img.src=safeImage(item.image);img.alt=item.name;img.loading='lazy';media.append(img);
    if(item.stock===0||item.featured){const badge=document.createElement('span');badge.className='catalog-badge';badge.textContent=item.stock===0?'ESGOTADO':'DESTAQUE';media.append(badge)}
    const meta=document.createElement('div');meta.className='catalog-meta';
    const cat=document.createElement('small');cat.textContent=item.category;
    const title=document.createElement('h3');title.textContent=item.name;
    const price=document.createElement('p');price.textContent=money(item.price);
    const stock=document.createElement('span');stock.className=`catalog-stock${item.stock===0?' is-empty':''}`;
    stock.textContent=item.stock==null?'Disponibilidade sob consulta':item.stock===0?'Esgotado':`${item.stock} ${item.stock===1?'unidade disponível':'unidades disponíveis'}`;
    const action=document.createElement(item.stock===0?'span':'a');
    if(item.stock===0){action.className='catalog-unavailable';action.textContent='INDISPONÍVEL'}
    else{action.href='#contato';action.innerHTML='CONSULTAR '+svgIcon('arrow');action.setAttribute('aria-label',`Consultar ${item.name} pelo WhatsApp`);action.addEventListener('click',event=>{event.preventDefault();const phone=STORE_WHATSAPP.replace(/\D/g,'');if(phone.length<12){alert('Configure o número de WhatsApp da loja no arquivo script.js para habilitar este botão.');return}window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Vim pelo site da JF Grifes e gostaria de saber mais sobre ${item.name}.`)}`,'_blank','noopener,noreferrer')})}
    meta.append(cat,title,price,stock,action);card.append(media,meta);grid.append(card);
  }
  document.getElementById('catalog-empty').hidden=products.length>0;
}
document.querySelectorAll('.catalog-filters button').forEach(button=>button.addEventListener('click',()=>{currentFilter=button.dataset.filter;document.querySelectorAll('.catalog-filters button').forEach(other=>other.classList.toggle('active',other===button));renderCatalog()}));
search?.addEventListener('input',renderCatalog);
async function refreshCatalog(){
  try{catalogProducts=await loadCatalog();renderCatalog()}
  catch{document.getElementById('catalog-empty').textContent='Não foi possível carregar os produtos agora. Tente atualizar a página.';document.getElementById('catalog-empty').hidden=false}
}
refreshCatalog();
