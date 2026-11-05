import {put} from '@vercel/blob';
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
