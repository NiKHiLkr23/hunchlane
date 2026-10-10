import { randomBytes,createCipheriv,createDecipheriv } from "node:crypto";
import { db } from "./store";
function key(){const value=process.env.CREDENTIALS_ENCRYPTION_KEY;if(!value||!/^[a-f0-9]{64}$/i.test(value))throw new Error("CREDENTIAL_VAULT_NOT_CONFIGURED");return Buffer.from(value,"hex");}
export function encrypt(value:unknown){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);const data=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".");}
export function decrypt<T>(value:string):T{const [iv,tag,data]=value.split(".");const decipher=createDecipheriv("aes-256-gcm",key(),Buffer.from(iv,"base64url"));decipher.setAuthTag(Buffer.from(tag,"base64url"));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,"base64url")),decipher.final()]).toString("utf8"));}
export async function readCredential<T>(id:string){const rows=await db()`select encrypted from credentials where id=${id}`;return rows[0]?decrypt<T>(String(rows[0].encrypted)):undefined;}
export async function writeCredential(id:string,value:unknown){const encoded=encrypt(value);await db()`insert into credentials(id,encrypted) values(${id},${encoded}) on conflict(id) do update set encrypted=excluded.encrypted,updated_at=now()`;}
