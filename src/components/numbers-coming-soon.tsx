import { ChartNoAxesCombined } from "lucide-react";
import "./numbers-coming-soon.css";

export function NumbersComingSoon() {
  return (
    <section className="numbers-coming-soon" aria-labelledby="numbers-coming-soon-title">
      <div className="numbers-placeholder" aria-hidden="true">
        <div className="numbers-placeholder-inputs">
          <div className="numbers-placeholder-line" />
          {Array.from({ length: 4 }, (_, index) => <div className="numbers-placeholder-field" key={index} />)}
        </div>
        <div className="numbers-placeholder-output">
          <div className="numbers-placeholder-metrics"><span /><span /></div>
          <div className="numbers-placeholder-chart">
            {[26, 34, 30, 44, 48, 42, 58, 66, 62, 76, 84, 94].map((height, index) =>
              <span key={index} style={{ height: `${height}%` }} />
            )}
          </div>
          <div className="numbers-placeholder-line" />
        </div>
      </div>
      <div className="numbers-coming-soon-copy">
        <span className="numbers-coming-soon-icon"><ChartNoAxesCombined size={24} aria-hidden="true" /></span>
        <h2 id="numbers-coming-soon-title">Numbers coming soon</h2>
        <p>Explore pricing, costs, and break-even for your idea.</p>
      </div>
    </section>
  );
}
