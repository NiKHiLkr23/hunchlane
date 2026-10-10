import { previewRun } from '../fixture';
export function GET(){if(process.env.NODE_ENV!=='development'||process.env.HUNCHLANE_UI_PREVIEW!=='1')return new Response(null,{status:404});return Response.json(previewRun);}
