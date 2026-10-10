import { IntakeRequestSchema } from '@/core/intake';
export async function POST(request:Request){
 if(process.env.NODE_ENV!=='development'||process.env.HUNCHLANE_UI_PREVIEW!=='1')return new Response(null,{status:404});
 const input=IntakeRequestSchema.parse(await request.json());
 const reply=input.turn===0?{message:'A useful first step is choosing who you would help. We can keep the rest open for now.',question:'Who would you help first?',suggestions:['People living on their own','Busy students','I want to explore that'],ready:false}:input.turn===1?{message:'That gives us a starting audience. Now let’s consider how they would get value from it.',question:input.brief.category==='software'?'What would make it feel different?':'How would someone get it?',suggestions:input.brief.category==='software'?['A simpler experience','Solve one specific problem','A different price']:['Delivered to their door','In my neighbourhood','Online'],ready:false}:{message:'There’s enough context to start looking for alternatives. Your answers will guide the research, and unanswered questions can stay open.',question:'',suggestions:[],ready:true};
 return Response.json({reply});
}

export function GET(){if(process.env.NODE_ENV!=='development'||process.env.HUNCHLANE_UI_PREVIEW!=='1')return new Response(null,{status:404});return Response.json({reply:null});}
