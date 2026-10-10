import { DRAFT_KEY, LEGACY_DRAFT_KEY, parseDraft, type IdeaDraft } from '@/core/idea-draft';
const PREVIEW_KEY = "hunchlane.preview.idea-draft.v2";
export function readIdeaDraft(preview=false): IdeaDraft | null {
  try {
    return parseDraft(localStorage.getItem(preview?PREVIEW_KEY:DRAFT_KEY), preview?null:localStorage.getItem(LEGACY_DRAFT_KEY));
  } catch {
    return null;
  }
}
export function saveIdeaDraft(draft: IdeaDraft,preview=false): boolean {
  try {
    localStorage.setItem(preview?PREVIEW_KEY:DRAFT_KEY, JSON.stringify(draft));
    if(!preview)localStorage.removeItem(LEGACY_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}
export function clearIdeaDraft(requestId: string,preview=false) {
  try {
    if (readIdeaDraft(preview)?.requestId === requestId) {
      localStorage.removeItem(preview?PREVIEW_KEY:DRAFT_KEY);
      if(!preview)localStorage.removeItem(LEGACY_DRAFT_KEY);
    }
  } catch {}
}
const FRESH_KEY = 'hunchlane.idea-fresh.v2';
export function readFreshDraft() {
  try {
    return parseDraft(sessionStorage.getItem(FRESH_KEY), null);
  } catch {
    return null;
  }
}
export function saveFreshDraft(draft: IdeaDraft) {
  try {
    sessionStorage.setItem(FRESH_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
export function clearFreshDraft() {
  try {
    sessionStorage.removeItem(FRESH_KEY);
  } catch {}
}
