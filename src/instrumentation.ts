export async function register(){if(process.env.NEXT_RUNTIME==="nodejs"){const {initializeTelemetry}=await import("./server/telemetry");await initializeTelemetry();}}
