import {isAuthenticated,sameOrigin,json} from '../server/auth.js';
import {readCatalog,writeCatalog,cleanProducts} from '../server/catalog.js';

export async function GET(){
  try{return json(await readCatalog())}catch{return json({error:'Não foi possível carregar o catálogo.'},503)}
}
export async function PUT(request){
  if(!isAuthenticated(request))return json({error:'Faça login para continuar.'},401);
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  if(!process.env.BLOB_READ_WRITE_TOKEN)return json({error:'Armazenamento não configurado.'},503);
  const size=Number(request.headers.get('content-length')||0);if(size>250_000)return json({error:'Catálogo muito grande.'},413);
  let body,products;try{body=await request.json();products=cleanProducts(body.products)}catch(error){return json({error:error.message||'Dados inválidos.'},400)}
  if(typeof body.version!=='string')return json({error:'Versão do catálogo ausente.'},400);
  try{const result=await writeCatalog(products,body.version);if(result.conflict)return json({error:'O catálogo mudou em outra sessão. Recarregue antes de salvar.'},409);return json(result)}catch{return json({error:'Não foi possível salvar. Tente novamente.'},503)}
}
