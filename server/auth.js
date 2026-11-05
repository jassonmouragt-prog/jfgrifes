import {createHmac, scryptSync, timingSafeEqual} from 'node:crypto';

const COOKIE_NAME='jf_admin_session';
const SESSION_SECONDS=60*60*24*7;
const attempts=new Map();

function equalHex(a,b){
  if(!/^[a-f0-9]+$/i.test(a)||!/^[a-f0-9]+$/i.test(b))return false;
  const left=Buffer.from(a,'hex');const right=Buffer.from(b,'hex');
  return left.length===right.length&&timingSafeEqual(left,right);
}
function signature(payload){return createHmac('sha256',process.env.SESSION_SECRET).update(payload).digest('base64url')}
function cookieValue(request){
  const cookies=request.headers.get('cookie')||'';
  const match=cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match?.[1]||'';
}
export function configured(){return Boolean(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD_SALT&&process.env.ADMIN_PASSWORD_HASH&&process.env.SESSION_SECRET)}
export function isAuthenticated(request){
  if(!configured())return false;
  const [payload,mac]=cookieValue(request).split('.');
  if(!payload||!mac)return false;
  const expected=signature(payload);
  const left=Buffer.from(mac);const right=Buffer.from(expected);
  if(left.length!==right.length||!timingSafeEqual(left,right))return false;
  try{const session=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));return session.sub===process.env.ADMIN_EMAIL&&session.exp>Date.now()}catch{return false}
}
export function verifyCredentials(email,password,ip){
  if(!configured())return {ok:false,reason:'config'};
  const now=Date.now();const key=ip||'unknown';const entry=attempts.get(key)||{count:0,until:now+15*60_000};
  if(now>entry.until){entry.count=0;entry.until=now+15*60_000}
  if(entry.count>=8)return {ok:false,reason:'rate'};
  const candidate=scryptSync(String(password),process.env.ADMIN_PASSWORD_SALT,64).toString('hex');
  const valid=String(email).trim().toLowerCase()===process.env.ADMIN_EMAIL.toLowerCase()&&equalHex(candidate,process.env.ADMIN_PASSWORD_HASH);
  if(valid){attempts.delete(key);return {ok:true}}
  entry.count++;attempts.set(key,entry);return {ok:false,reason:'invalid'};
}
export function sessionCookie(request){
  const payload=Buffer.from(JSON.stringify({sub:process.env.ADMIN_EMAIL,exp:Date.now()+SESSION_SECONDS*1000})).toString('base64url');
  const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
  return `${COOKIE_NAME}=${payload}.${signature(payload)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secure}`;
}
export function clearSessionCookie(request){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`}
export function sameOrigin(request){
  const origin=request.headers.get('origin');if(!origin)return false;
  try{return new URL(origin).host===new URL(request.url).host}catch{return false}
}
export function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
