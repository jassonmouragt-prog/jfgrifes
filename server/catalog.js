import {get,list,put,del} from '@vercel/blob';
import {randomUUID} from 'node:crypto';

const PREFIX='catalog/versions/';
export const DEFAULT_PRODUCTS=[
  {id:'camiseta-premium',name:'Camiseta premium',category:'Camisetas',price:null,image:'assets/promo-shirt.webp',description:'Conforto e estilo para o dia a dia.',featured:true},
  {id:'tenis-urbano',name:'Tênis urbano',category:'Calçados',price:null,image:'assets/promo-sneakers.webp',description:'Versatilidade para acompanhar todos os momentos.',featured:true},
  {id:'bone-original',name:'Boné original',category:'Acessórios',price:null,image:'assets/promo-cap.webp',description:'O detalhe que completa o look.',featured:false},
  {id:'bermuda-casual',name:'Bermuda casual',category:'Bermudas',price:null,image:'assets/promo-shorts.webp',description:'Leveza e liberdade para a sua rotina.',featured:false}
];
async function versions(){
  const all=[];let cursor;
  do{const page=await list({prefix:PREFIX,limit:1000,...(cursor?{cursor}:{})});all.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined}while(cursor);
  return all.sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
}
export async function readCatalog(){
  if(!process.env.BLOB_READ_WRITE_TOKEN)return {products:DEFAULT_PRODUCTS,version:'seed'};
  const [latest]=await versions();if(!latest)return {products:DEFAULT_PRODUCTS,version:'seed'};
  const result=await get(latest.pathname,{access:'public'});
  if(!result?.stream)throw new Error('Catalog blob unavailable');
  const products=await new Response(result.stream).json();
  return {products,version:latest.pathname};
}
export async function writeCatalog(products,expectedVersion){
  const prior=await readCatalog();
  if(prior.version!==expectedVersion)return {conflict:true};
  const pathname=`${PREFIX}${Date.now()}-${randomUUID()}.json`;
  await put(pathname,JSON.stringify(products),{access:'public',contentType:'application/json',addRandomSuffix:false,cacheControlMaxAge:60});
  try{const all=await versions();const old=all.slice(50).map(blob=>blob.url);if(old.length)await del(old)}catch{}
  return {products,version:pathname};
}
export function cleanProducts(value){
  if(!Array.isArray(value)||value.length>500)throw new Error('Catálogo inválido.');
  const categories=new Set(['Camisetas','Bermudas','Calçados','Acessórios']);
  const ids=new Set();
  return value.map(item=>{
    if(!item||typeof item!=='object')throw new Error('Produto inválido.');
    const id=String(item.id||'');const name=String(item.name||'').trim();const category=String(item.category||'');const description=String(item.description||'').trim();const image=String(item.image||'');
    if(!/^[a-zA-Z0-9-]{1,80}$/.test(id)||ids.has(id)||!name||name.length>80||!categories.has(category)||description.length>160)throw new Error('Revise os dados dos produtos.');
    ids.add(id);
    let allowedImage=false;
    if(/^assets\/[a-zA-Z0-9-]+\.webp$/.test(image))allowedImage=true;
    try{const url=new URL(image);allowedImage=url.protocol==='https:'&&url.hostname.endsWith('.public.blob.vercel-storage.com')}catch{}
    if(!allowedImage)throw new Error('Imagem de produto inválida.');
    const price=item.price==null||item.price===''?null:Number(item.price);
    if(price!==null&&(!Number.isFinite(price)||price<0||price>1_000_000))throw new Error('Preço inválido.');
    return {id,name,category,description,image,price,featured:Boolean(item.featured)};
  });
}
