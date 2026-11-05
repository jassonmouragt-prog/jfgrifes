import {put,del} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {isAuthenticated,sameOrigin,json} from '../server/auth.js';

export async function POST(request){
  if(!isAuthenticated(request))return json({error:'Faça login para continuar.'},401);
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:'Armazenamento não configurado.'},503);
  if(Number(request.headers.get('content-length')||0)>2_000_000)return json({error:'Foto muito grande. Escolha uma imagem menor.'},413);
  let body;try{body=await request.json()}catch{return json({error:'Imagem inválida.'},400)}
  const match=/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(body?.dataUrl||'');
  if(!match)return json({error:'Envie uma foto WebP.'},400);
  const bytes=Buffer.from(match[1],'base64');if(bytes.length<100||bytes.length>1_500_000)return json({error:'Foto muito grande. Escolha uma imagem menor.'},413);
  try{const blob=await put(`products/${randomUUID()}.webp`,bytes,{access:'public',contentType:'image/webp',addRandomSuffix:false});return json({url:blob.url})}catch{return json({error:'Não foi possível enviar a foto.'},503)}
}
/* Remove uma foto de produto que não está mais em uso. Só aceita arquivos da pasta products/ do armazenamento. */
export async function DELETE(request){
  if(!isAuthenticated(request))return json({error:'Faça login para continuar.'},401);
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:'Armazenamento não configurado.'},503);
  let body;try{body=await request.json()}catch{return json({error:'Pedido inválido.'},400)}
  let url;try{url=new URL(String(body?.url||''))}catch{return json({error:'Foto inválida.'},400)}
  if(url.protocol!=='https:'||!url.hostname.endsWith('.public.blob.vercel-storage.com')||!/^\/products\/[a-f0-9-]{36}\.webp$/.test(url.pathname))return json({error:'Foto inválida.'},400);
  try{await del(url.href);return json({ok:true})}catch{return json({error:'Não foi possível remover a foto.'},503)}
}
