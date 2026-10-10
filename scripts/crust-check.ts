import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import { checkCrustAccount } from "../src/server/crustdata";
loadEnvConfig(process.cwd());
try{const account=await checkCrustAccount(5);console.log(`Crustdata connected. Web Search/Fetch enabled at 1 credit each. Available account credits: ${account.credits}. No credits spent.`);}
catch{console.error("Crustdata check failed. Verify the API key, Web Search/Fetch access, balance and account rates. No paid calls were made.");process.exitCode=1;}
