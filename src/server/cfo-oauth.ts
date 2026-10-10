import { auth as mcpAuth,type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientInformationMixed,OAuthTokens,OAuthClientMetadata } from "@modelcontextprotocol/sdk/shared/auth.js";
import { randomBytes,timingSafeEqual } from "node:crypto";
import { readCredential,writeCredential } from "./credential-vault";
export const CFO_URL="https://api.cfo.ai/mcp";
type State={client?:OAuthClientInformationMixed;tokens?:OAuthTokens;verifier?:string;nonce?:string;createdAt?:number;consumed?:boolean};
export class CfoOAuthProvider implements OAuthClientProvider {
  authorizationUrl?:string;
  constructor(private id:string,private data:State,private interactive=false){}
  get redirectUrl(){const base=process.env.NEXT_PUBLIC_APP_URL;if(!base)throw new Error("APP_URL_NOT_CONFIGURED");return `${base.replace(/\/$/,"")}/api/integrations/cfo/callback`;}
  get clientMetadata():OAuthClientMetadata{return {client_name:"Hunchlane",redirect_uris:[this.redirectUrl],grant_types:["authorization_code","refresh_token"],response_types:["code"],token_endpoint_auth_method:"none"};}
  async state(){return this.data.nonce || "";}
  clientInformation(){return this.data.client;}
  async saveClientInformation(client:OAuthClientInformationMixed){this.data.client=client;await this.save();}
  tokens(){return this.data.tokens;}
  async saveTokens(tokens:OAuthTokens){this.data.tokens=tokens;await this.save();}
  async redirectToAuthorization(url:URL){if(!this.interactive)throw new Error("CFO_REAUTHORIZATION_REQUIRED");this.authorizationUrl=url.href;}
  async saveCodeVerifier(verifier:string){this.data.verifier=verifier;await this.save();}
  codeVerifier(){if(!this.data.verifier)throw new Error("CFO_PKCE_MISSING");return this.data.verifier;}
  async invalidateCredentials(scope:"all"|"client"|"tokens"|"verifier"|"discovery"){if(scope==="all")this.data={};else if(scope==="client")delete this.data.client;else if(scope==="tokens")delete this.data.tokens;else if(scope==="verifier")delete this.data.verifier;await this.save();}
  snapshot(){return this.data;}
  private async save(){await writeCredential(this.id,this.data);}
}
export async function beginCfoAuthorization(owner:string){
  const saved=await readCredential<State>("cfo:connection");const data:State={client:saved?.client,nonce:randomBytes(24).toString("base64url"),createdAt:Date.now()};
  await writeCredential(`cfo:pending:${owner}`,data);
  const provider=new CfoOAuthProvider(`cfo:pending:${owner}`,data,true);
  await mcpAuth(provider,{serverUrl:CFO_URL});
  if(!provider.authorizationUrl)throw new Error("CFO_AUTHORIZATION_UNAVAILABLE");return provider.authorizationUrl;
}
export async function completeCfoAuthorization(owner:string,nonce:string,code:string){
  const data=await readCredential<State>(`cfo:pending:${owner}`);
  if(!data?.nonce||data.consumed||Date.now()-(data.createdAt||0)>600000||nonce.length!==data.nonce.length||!timingSafeEqual(Buffer.from(nonce),Buffer.from(data.nonce)))throw new Error("CFO_STATE_INVALID");
  // Consume before exchanging; an uncertain exchange requires a fresh explicit authorization.
  data.consumed=true;await writeCredential(`cfo:pending:${owner}`,data);
  const provider=new CfoOAuthProvider(`cfo:pending:${owner}`,data);
  const result=await mcpAuth(provider,{serverUrl:CFO_URL,authorizationCode:code});
  if(result!=="AUTHORIZED")throw new Error("CFO_AUTHORIZATION_INCOMPLETE");
  await writeCredential("cfo:connection",{client:provider.snapshot().client,tokens:provider.snapshot().tokens});
  const client=await connectCfo();try{await client.listTools();await client.callTool({name:"list_orgs",arguments:{}});}finally{await client.close();}
}
export async function connectCfo(){
  const data=await readCredential<State>("cfo:connection");if(!data?.tokens)throw new Error("CFO_NOT_CONNECTED");
  const provider=new CfoOAuthProvider("cfo:connection",data);
  const transport=new StreamableHTTPClientTransport(new URL(CFO_URL),{authProvider:provider});
  const client=new Client({name:"hunchlane",version:"0.1.0"});
  try{await client.connect(transport);return client;}catch(e){await client.close().catch(()=>undefined);throw e;}
}
