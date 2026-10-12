"use client";
import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { ResearchReport } from "@/core/types";
import { reportFilename, reportMarkdown } from "@/core/report-export";
import { Button } from "./ui/button";
import "./report-export.css";

export function ReportExport({
  report,
  sample = false,
  shared = false,
  compact = false,
}: {
  report: ResearchReport;
  sample?: boolean;
  shared?: boolean;
  compact?: boolean;
}) {
  const markdown = useMemo(
    () => reportMarkdown(report, sample, shared),
    [report, sample, shared]
  );
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  async function copyReport() {
    if (copying) return;
    setCopying(true);
    setCopied(false);
    setStatus("");
    setError(false);
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setManualCopy(false);
      setStatus("Report copied as Markdown.");
    } catch {
      setError(true);
      setManualCopy(true);
      setStatus(
        "Copy didn't work. Select the report below to copy it, or download Markdown."
      );
    } finally {
      setCopying(false);
    }
  }
  function downloadReport() {
    setError(false);
    let url: string | undefined;
    let anchor: HTMLAnchorElement | undefined;
    try {
      url = URL.createObjectURL(
        new Blob([markdown], { type: "text/markdown;charset=utf-8" })
      );
      anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = reportFilename(report);
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      setStatus("Markdown download started.");
    } catch {
      setError(true);
      setStatus(
        "Download couldn't start. Use Copy report to save the Markdown."
      );
    } finally {
      anchor?.remove();
      if (url) {
        const fileUrl = url;
        setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      }
    }
  }
  return (
    <div className={`report-export${compact ? " report-export-compact" : ""}`}>
      <div
        className="report-export-buttons"
        role="group"
        aria-label="Export report"
      >
        <Button
          type="button"
          variant="secondary"
          onClick={copyReport}
          disabled={copying}
        >
          {copied ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {copying ? "Copying…" : copied ? "Copied" : "Copy report"}
        </Button>
        <Button type="button" variant="secondary" onClick={downloadReport}>
          <Download size={16} aria-hidden="true" />
          Download Markdown
        </Button>
      </div>
      <p className={compact && !error ? "sr-only" : "report-export-status"} role="status">
        {status}
      </p>
      {manualCopy && (
        <label className="report-export-manual">
          Report Markdown
          <textarea
            readOnly
            value={markdown}
            onFocus={(event) => event.currentTarget.select()}
            rows={8}
          />
        </label>
      )}
    </div>
  );
}
