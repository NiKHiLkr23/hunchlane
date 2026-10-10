import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { mkdir,writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd());
const { connectCfo }=await import("../src/server/cfo-oauth");
const client=await connectCfo();try{const tools=await client.listTools();const orgs=await client.callTool({name:"list_orgs",arguments:{}});if(orgs.isError)throw new Error("Workspace inspection failed.");await mkdir(".cfo",{recursive:true});await writeFile(".cfo/server-contract.json",JSON.stringify({instructions:client.getInstructions(),tools:tools.tools,workspaceReceipt:orgs},null,2));console.log("CFO.ai access inspected. Private server contract saved to ignored .cfo/server-contract.json. Modeling is not yet verified.");}finally{await client.close();}
