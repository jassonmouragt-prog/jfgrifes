/* Dados de exemplo usados apenas quando a API ainda não estiver disponível no preview local. */
const DEFAULT_PRODUCTS = [
  {id:'camiseta-premium',name:'Camiseta premium',category:'Camisetas',price:null,image:'assets/promo-shirt.webp',description:'Conforto e estilo para o dia a dia.',featured:true},
  {id:'tenis-urbano',name:'Tênis urbano',category:'Calçados',price:null,image:'assets/promo-sneakers.webp',description:'Versatilidade para acompanhar todos os momentos.',featured:true},
  {id:'bone-original',name:'Boné original',category:'Acessórios',price:null,image:'assets/promo-cap.webp',description:'O detalhe que completa o look.',featured:false},
  {id:'bermuda-casual',name:'Bermuda casual',category:'Bermudas',price:null,image:'assets/promo-shorts.webp',description:'Leveza e liberdade para a sua rotina.',featured:false}
];
async function loadCatalog(){
  const response=await fetch('/api/catalog',{cache:'no-store'});
  if(response.status===404&&['localhost','127.0.0.1'].includes(location.hostname))return DEFAULT_PRODUCTS;
  if(!response.ok)throw new Error('Não foi possível carregar os produtos.');
  const data=await response.json();return Array.isArray(data.products)?data.products:DEFAULT_PRODUCTS;
}
function money(value){return value==null||value===''?'Consulte o preço':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value))}
function safeImage(value){
  if(typeof value!=='string')return 'assets/cat-camisetas.webp';
  if(/^assets\/[a-zA-Z0-9-]+\.webp$/.test(value)||/^data:image\/(jpeg|png|webp);base64,/.test(value))return value;
  try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname.endsWith('.public.blob.vercel-storage.com'))return value}catch{}
  return 'assets/cat-camisetas.webp';
}
