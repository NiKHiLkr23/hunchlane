import { notFound } from 'next/navigation';
import { IdeaConversation } from '@/components/idea-conversation';
export const dynamic='force-dynamic';
export default function IdeaPreview(){if(process.env.NODE_ENV!=='development'||process.env.HUNCHLANE_UI_PREVIEW!=='1')notFound();return <><div className="chat-preview-bar">Design preview · deterministic conversation · no AI or paid research</div><IdeaConversation preview/></>;}
