const list=document.getElementById('admin-list');
const dialog=document.getElementById('product-dialog');
const form=document.getElementById('product-form');
const photoInput=document.getElementById('photo');
const preview=document.getElementById('upload-preview');
const errorText=document.getElementById('form-error');
const loginScreen=document.getElementById('login-screen');
const adminApp=document.getElementById('admin-app');
const loginForm=document.getElementById('login-form');
let editingId=null,currentImage='',products=[],version='seed';

async function api(url,options={}){
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
  const data=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}));
  if(!response.ok){const error=new Error(data.error||'Não foi possível concluir a operação.');error.status=response.status;throw error}
  return data;
}
function showError(message){errorText.textContent=message;errorText.hidden=!message}
function showLoginError(message){const el=document.getElementById('login-error');el.textContent=message;el.hidden=!message}
function showPreview(src){preview.replaceChildren();if(src){const image=document.createElement('img');image.src=safeImage(src);image.alt='Prévia da foto do produto';preview.append(image)}else{const label=document.createElement('span');label.textContent='PRÉVIA DA FOTO';preview.append(label)}}
function showLoggedIn(active){loginScreen.hidden=active;adminApp.hidden=!active;document.getElementById('logout').hidden=!active;if(!active)loginForm.reset()}
async function loadCatalog(){const data=await api('/api/catalog');products=data.products;version=data.version;renderAdmin()}
async function persist(next){
  try{const data=await api('/api/catalog',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({products:next,version})});products=data.products;version=data.version;renderAdmin()}
  catch(error){if(error.status===409)await loadCatalog();throw error}
}
function renderAdmin(){
  document.getElementById('product-count').textContent=products.length;
  document.getElementById('stock-count').textContent=products.reduce((total,item)=>total+(Number.isInteger(item.stock)?item.stock:0),0);
  document.getElementById('soldout-count').textContent=products.filter(item=>item.stock===0).length;
  document.getElementById('category-count').textContent=new Set(products.map(item=>item.category)).size;
  list.replaceChildren();document.getElementById('list-empty').hidden=products.length>0;
  for(const item of products){
    const row=document.createElement('article');row.className='admin-item';
    const image=document.createElement('img');image.src=safeImage(item.image);image.alt='';
    const info=document.createElement('div');const title=document.createElement('h3');title.textContent=item.name;
    const meta=document.createElement('p');meta.textContent=`${item.category} · ${money(item.price)}${item.featured?' · Destaque':''}`;
    const stock=document.createElement('small');stock.className=`stock-status${item.stock===0?' is-empty':''}`;stock.textContent=item.stock==null?'Estoque não informado':item.stock===0?'Esgotado':`${item.stock} ${item.stock===1?'unidade':'unidades'} em estoque`;
    info.append(title,meta,stock);
    const actions=document.createElement('div');actions.className='item-actions';
    const edit=document.createElement('button');edit.type='button';edit.textContent='EDITAR';edit.addEventListener('click',()=>openForm(item));
    const remove=document.createElement('button');remove.type='button';remove.className='delete';remove.textContent='EXCLUIR';remove.setAttribute('aria-label',`Excluir ${item.name}`);
    remove.addEventListener('click',async()=>{if(!confirm(`Excluir “${item.name}” do catálogo?`))return;remove.disabled=true;try{await persist(products.filter(product=>product.id!==item.id))}catch(error){alert(error.message)}finally{remove.disabled=false}});
    actions.append(edit,remove);row.append(image,info,actions);list.append(row);
  }
}
function openForm(item){form.reset();photoInput.value='';showError('');editingId=item?.id||null;currentImage=item?.image||'';document.getElementById('dialog-title').textContent=item?'Editar produto':'Novo produto';if(item){form.elements.name.value=item.name;form.elements.category.value=item.category;form.elements.price.value=item.price??'';form.elements.stock.value=item.stock??'';form.elements.description.value=item.description||'';document.getElementById('featured').checked=!!item.featured}showPreview(currentImage);dialog.showModal();form.elements.name.focus()}
document.getElementById('new-product').addEventListener('click',()=>openForm(null));
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
document.getElementById('cancel-dialog').addEventListener('click',()=>dialog.close());
document.getElementById('remove-photo').addEventListener('click',()=>{currentImage='';photoInput.value='';showPreview('')});
photoInput.addEventListener('change',async()=>{
  const file=photoInput.files?.[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)){showError('Escolha uma imagem JPG, PNG ou WebP.');return}
  if(file.size>15_000_000){showError('A foto deve ter até 15 MB. Escolha uma imagem menor.');return}
  try{const bitmap=await createImageBitmap(file);const scale=Math.min(1,1000/bitmap.width,1200/bitmap.height);const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();currentImage=canvas.toDataURL('image/webp',.76);showPreview(currentImage);showError('')}catch{showError('Não foi possível ler esta foto. Escolha outra imagem.')}
});
async function uploadImage(dataUrl){const data=await api('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl})});return data.url}
form.addEventListener('submit',async event=>{
  event.preventDefault();showError('');
  const name=form.elements.name.value.trim(),category=form.elements.category.value,priceRaw=form.elements.price.value,stockRaw=form.elements.stock.value;
  const price=priceRaw===''?null:Number(priceRaw);
  const stock=stockRaw===''?null:Number(stockRaw);
  if(!name){showError('Informe o nome do produto.');form.elements.name.focus();return}
  if(!category){showError('Escolha uma categoria.');form.elements.category.focus();return}
  if(price!==null&&(!Number.isFinite(price)||price<0)){showError('Informe um preço válido ou deixe o campo vazio.');form.elements.price.focus();return}
  if(stock===null||!Number.isInteger(stock)||stock<0||stock>1_000_000){showError('Informe a quantidade em estoque com um número inteiro igual ou maior que zero.');form.elements.stock.focus();return}
  if(!currentImage){showError('Escolha uma foto do produto.');return}
  const saveButton=form.querySelector('[type="submit"]');saveButton.disabled=true;saveButton.textContent='SALVANDO...';
  try{
    const image=currentImage.startsWith('data:')?await uploadImage(currentImage):currentImage;
    const product={id:editingId||crypto.randomUUID(),name,category,price,stock,image,description:form.elements.description.value.trim(),featured:document.getElementById('featured').checked};
    const next=[...products];const index=next.findIndex(item=>item.id===editingId);if(index>=0)next[index]=product;else next.unshift(product);
    await persist(next);dialog.close();
  }catch(error){showError(error.message)}finally{saveButton.disabled=false;saveButton.textContent='SALVAR PRODUTO'}
});
document.getElementById('export-json').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(products,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='jf-grifes-catalogo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
document.getElementById('import-json').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{
    if(file.size>5_000_000)throw new Error('Arquivo muito grande.');
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data)||data.length>500||!data.every(item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&['Camisetas','Bermudas','Calçados','Acessórios'].includes(item.category)&&typeof item.image==='string'))throw new Error('Arquivo inválido.');
    if(!confirm(`Substituir o catálogo atual por ${data.length} produto(s) do arquivo?`))return;
    const next=[];for(const item of data){const image=item.image.startsWith('data:')?await uploadImage(item.image):item.image;next.push({...item,image})}
    await persist(next);alert('Catálogo importado com sucesso.');
  }catch(error){alert(error.message||'Não foi possível importar o catálogo.')}finally{event.target.value=''}
});
loginForm.addEventListener('submit',async event=>{
  event.preventDefault();showLoginError('');const button=loginForm.querySelector('button');button.disabled=true;button.textContent='ENTRANDO...';
  try{await api('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('login-email').value,password:document.getElementById('login-password').value})});await loadCatalog();showLoggedIn(true)}catch(error){showLoginError(error.message)}finally{button.disabled=false;button.textContent='ENTRAR NO PAINEL'}
});
document.getElementById('logout').addEventListener('click',async()=>{try{await api('/api/auth',{method:'DELETE'})}finally{products=[];showLoggedIn(false)}});
async function initialize(){try{const state=await api('/api/auth');if(state.authenticated){await loadCatalog();showLoggedIn(true)}else{showLoggedIn(false);if(!state.configured)showLoginError('O painel ainda não foi configurado no servidor.')}}catch(error){showLoggedIn(false);showLoginError('Não foi possível conectar ao servidor. Tente novamente.')}}
initialize();
