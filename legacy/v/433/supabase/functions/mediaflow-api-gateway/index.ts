// MediaFlow v433 backend skeleton. NOT DEPLOYED OR ACTIVATED in v433.
// v434 must verify provider terms, secrets, signature handling, quotas and
// actual API artwork rights before enabling new network calls.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin="https://alexgodly.github.io";
function headers(origin:string){
  const h:Record<string,string>={"Content-Type":"application/json","Vary":"Origin"};
  if(origin===allowedOrigin){h["Access-Control-Allow-Origin"]=allowedOrigin;h["Access-Control-Allow-Headers"]="authorization, apikey, content-type";h["Access-Control-Allow-Methods"]="POST, OPTIONS";}
  return h;
}
Deno.serve(async(request:Request)=>{
  const origin=request.headers.get("origin")||"";
  const h=headers(origin);
  const reply=(code:number,body:unknown)=>new Response(JSON.stringify(body),{status:code,headers:h});
  if(origin&&origin!==allowedOrigin)return reply(403,{error:"Origin not permitted"});
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:h});
  if(request.method!=="POST")return reply(405,{error:"Use POST"});
  const jwt=request.headers.get("Authorization")?.replace(/^Bearer\s+/i,"")||"";
  if(!jwt)return reply(401,{error:"Authenticated MediaFlow user required"});
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY");
  if(!url||!anon)return reply(503,{error:"Gateway environment unavailable"});
  const supabase=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data,error}=await supabase.auth.getUser(jwt);
  if(error||!data.user)return reply(401,{error:"Session could not be verified"});
  let body:Record<string,unknown>;
  try{body=await request.json();if(!body||typeof body!=="object"||Array.isArray(body))throw Error();}
  catch(_){return reply(400,{error:"Invalid request"});}
  if(body.action==="status")
    return reply(200,{version:433,ready:false,activeProviders:[],next:"Configure and test adapters in v434"});
  // Fail closed; no outbound API calls, no credential leaks, no provider data.
  return reply(503,{error:"Provider operations are staged for v434 testing and activation"});
});
