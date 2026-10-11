import {expect,it} from 'vitest';
import {sampleReport} from '@/core/sample';
import {recoverRetrievedAlternatives,validateEvidence,EvidenceValidationError} from '@/core/evidence';
import {assembleReport} from '@/server/research';

it('recovers a cached report without modifying the original response or source receipts',()=>{
  const content=structuredClone(sampleReport),original=structuredClone(content);
  content.competitors[0].url='https://unretrieved.example/';
  const saved=structuredClone(content);
  const evidence={sources:content.sources,text:''};
  const report=assembleReport(content,evidence,content.brief,null);
  expect(content).toEqual(saved);
  expect(report.sources).toBe(evidence.sources);
  expect(report.competitors).toHaveLength(original.competitors.length-1);
  expect(report.searchNotes[0]).toContain('excluded');
  expect(()=>validateEvidence(report,report.sources)).not.toThrow();
  expect(assembleReport(content,evidence,content.brief,null).competitors).toEqual(report.competitors);
});
it('downgrades to insufficient evidence when all alternatives are excluded',()=>{
  const content=structuredClone(sampleReport);
  content.competitors.forEach(c=>{c.url='https://unretrieved.example/';});
  const repaired=recoverRetrievedAlternatives(content,content.sources);
  expect(repaired.verdict).toBe('insufficient_evidence');
  expect(repaired.summary.nature).toBe('hypothesis');
  expect(repaired.summary.text).toContain('does not mean the idea is new');
  expect(validateEvidence(repaired,content.sources)).toBe(repaired);
});
it('keeps an unchanged valid report and bounded limitations',()=>{
  expect(recoverRetrievedAlternatives(sampleReport,sampleReport.sources)).toBe(sampleReport);
  const content=structuredClone(sampleReport);content.searchNotes=Array(6).fill('Coverage limitation');content.competitors[0].url='https://missing.example/';
  expect(recoverRetrievedAlternatives(content,content.sources).searchNotes).toHaveLength(6);
});
it('still refuses invented citations and false page verification in retained alternatives',()=>{
  const content=structuredClone(sampleReport);content.competitors[0].url='https://missing.example/';
  content.angles[0].explanation.sourceIds=['invented'];
  expect(()=>assembleReport(content,{sources:content.sources,text:''},content.brief,null)).toThrow(EvidenceValidationError);
  content.angles[0].explanation.sourceIds=[content.sources[0].id];
  content.angles[0].explanation.text='Verified from the official page.';
  expect(()=>assembleReport(content,{sources:content.sources.map(s=>({...s,evidenceLevel:'search_preview'})),text:''},content.brief,null)).toThrow('search preview');
});
it('removes dependent suggestions and replaces an experiment referencing an excluded name',()=>{
  const content=structuredClone(sampleReport),name=content.competitors[0].name;
  content.competitors[0].url='https://missing.example/';
  content.angles[0].explanation.text=`Compare against ${name}`;content.experiment.title=`Beat ${name}`;
  const repaired=recoverRetrievedAlternatives(content,content.sources);
  expect(repaired.angles.some(a=>a.explanation.text.includes(name))).toBe(false);
  expect(repaired.experiment.title).toBe('Understand the current workaround');
});
it('never upgrades an insufficient-evidence verdict when removing alternatives',()=>{
  const content=structuredClone(sampleReport);content.verdict='insufficient_evidence';content.competitors[0].url='https://missing.example/';
  expect(recoverRetrievedAlternatives(content,content.sources).verdict).toBe('insufficient_evidence');
});
