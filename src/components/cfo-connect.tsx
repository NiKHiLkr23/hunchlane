"use client";
import { useState } from "react";
import { Button } from "./ui/button";
export function CfoConnect(){const [error,setError]=useState(""),[busy,setBusy]=useState(false);async function connect(){setBusy(true);try{const r=await fetch("/api/integrations/cfo/connect",{method:"POST"});const data=await r.json();if(!r.ok)throw new Error(data.error);window.location.assign(data.url);}catch(e){setError(e instanceof Error?e.message:"Could not connect.");setBusy(false);}}return <><Button disabled={busy} onClick={connect}>{busy?"Opening authorization…":"Connect dedicated CFO.ai workspace ↗"}</Button>{error&&<p className="error-message" role="alert">{error}</p>}</>;}
