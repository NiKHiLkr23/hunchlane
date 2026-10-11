import { notFound, redirect } from "next/navigation";
export default function IdeaPreview() {
  if (process.env.NODE_ENV !== "development" || process.env.HUNCHLANE_UI_PREVIEW !== "1") notFound();
  redirect("/dev/agent-preview");
}
