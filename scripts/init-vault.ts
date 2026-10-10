import { readFile,appendFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
let text="";try{text=await readFile(".env.local","utf8");}catch{}
if(/^CREDENTIALS_ENCRYPTION_KEY=.+$/m.test(text))console.log("Credential encryption key already exists; preserved.");
else{await appendFile(".env.local",`\nCREDENTIALS_ENCRYPTION_KEY=${randomBytes(32).toString("hex")}\n`);console.log("Generated a credential encryption key in ignored .env.local. No key printed.");}
