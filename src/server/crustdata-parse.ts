import { load } from "cheerio";
import { z } from "zod";
import { safeWebUrl } from "@/core/evidence";
import type { EvidenceSource } from "@/core/types";
import type { ResearchEvidence } from "./research";

const SearchSchema=z.object({success:z.boolean(),query:z.string(),timestamp:z.number(),results:z.array(z.object({source:z.literal("web"),title:z.string(),url:z.string(),snippet:z.string().nullish(),position:z.number().optional()}))});
const FetchSchema=z.array(z.object({success:z.boolean().nullable(),url:z.string().nullable(),timestamp:z.number().nullable(),title:z.string().nullable(),content:z.string().nullable()}));
export type SearchReceipt={query:string;sources:EvidenceSource[]};
export type PageReceipt={url:string;title:string;text:string;retrievedAt:string};

export function normalizeUrl(value:string){if(!safeWebUrl(value))return null;const url=new URL(value);url.hash="";return url.href;}
export function parseSearch(value:unknown):SearchReceipt {
  const parsed=SearchSchema.parse(value);if(!parsed.success)throw new Error("CRUST_SEARCH_FAILED");
  const sources=new Map<string,EvidenceSource>();
  for(const result of parsed.results){const url=normalizeUrl(result.url);if(!url||sources.has(url))continue;sources.set(url,{id:`s${sources.size+1}`,url,title:result.title.slice(0,300),retrievedAt:new Date(parsed.timestamp).toISOString(),kind:"other",excerpt:(result.snippet||"").slice(0,900)});if(sources.size>=12)break;}
  return {query:parsed.query,sources:[...sources.values()]};
}
export function parsePages(value:unknown,requested:string[]):PageReceipt[]{
  const allowed=new Set(requested.map(normalizeUrl));const pages=new Map<string,PageReceipt>();
  for(const result of FetchSchema.parse(value)){
    if(!result.success||!result.url||!result.content)continue;
    const url=normalizeUrl(result.url);if(!url||!allowed.has(url))continue;
    const $=load(result.content);$("script,style,noscript,svg,iframe,form,nav,footer,header").remove();
    const text=$("body").text().replace(/\s+/g," ").trim().slice(0,6000);
    if(!text)continue;
    pages.set(url,{url,title:(result.title||$("title").text()||new URL(url).hostname).slice(0,300),text,retrievedAt:result.timestamp?new Date(result.timestamp*1000).toISOString():new Date().toISOString()});
  }
  return [...pages.values()];
}
export function crustEvidence(searches:SearchReceipt[],pages:PageReceipt[],requested:string[]):ResearchEvidence{
  const sources=new Map<string,EvidenceSource>();for(const search of searches)for(const source of search.sources)sources.set(source.url,source);
  const pageByUrl=new Map(pages.map(p=>[p.url,p]));
  const receipts=[...sources.values()].map((source,i)=>{const page=pageByUrl.get(source.url);return {...source,id:`s${i+1}`,title:page?.title||source.title,retrievedAt:page?.retrievedAt||source.retrievedAt,excerpt:page?.text.slice(0,900)||source.excerpt};});
  return {sources:receipts,text:JSON.stringify({queries:searches.map(s=>s.query),coverage:"Search snippets are previews. Only pages with fetchedText were read. Pricing or availability absent from fetched text is unverified. Search cannot prove novelty.",failedFetches:requested.filter(url=>!pageByUrl.has(url)),receipts:receipts.map(source=>({...source,fetchedText:pageByUrl.get(source.url)?.text||null}))})};
}
