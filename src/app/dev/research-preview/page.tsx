import { notFound } from 'next/navigation';
import { RunProgress } from '@/components/run-progress';
import { previewRun } from './fixture';
export const dynamic='force-dynamic';
export default function ResearchPreview(){if(process.env.NODE_ENV!=='development'||process.env.HUNCHLANE_UI_PREVIEW!=='1')notFound();return <><div className="chat-preview-bar">Design preview · saved-stage fixtures · no live research</div><RunProgress initial={previewRun} preview/></>;}
