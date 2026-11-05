import {configured,isAuthenticated,verifyCredentials,sessionCookie,clearSessionCookie,sameOrigin,json} from '../server/auth.js';

export async function GET(request){return json({authenticated:isAuthenticated(request),configured:configured()})}
export async function POST(request){
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  if(!configured())return json({error:'O painel ainda não foi configurado.'},503);
  let body;try{body=await request.json()}catch{return json({error:'Dados inválidos.'},400)}
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const result=verifyCredentials(body.email,body.password,ip);
  if(!result.ok)return json({error:result.reason==='rate'?'Muitas tentativas. Aguarde 15 minutos.':'E-mail ou senha incorretos.'},result.reason==='rate'?429:401);
  return json({authenticated:true},200,{'Set-Cookie':sessionCookie(request)});
}
export async function DELETE(request){
  if(!sameOrigin(request))return json({error:'Origem inválida.'},403);
  return json({authenticated:false},200,{'Set-Cookie':clearSessionCookie(request)});
}
