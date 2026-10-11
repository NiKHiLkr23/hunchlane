import Image from "next/image";
import { ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import "@/app/auth.css";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="auth-studio">
      <div className="auth-frame">
        <aside className="auth-story" aria-label="A place for your next idea">
          <div className="auth-art" aria-hidden="true">
            <div className="auth-orbit auth-orbit-one" />
            <div className="auth-orbit auth-orbit-two" />
            <Image
              src="/illustrations/idea-note-v1.png"
              alt=""
              width={1254}
              height={1254}
              sizes="(max-width: 760px) 160px, 400px"
              className="auth-note"
              preload
            />
          </div>
          <div className="auth-story-copy">
            <h2>
              Make room for
              <br />
              your next <span>hunch.</span>
            </h2>
            <p>
              See what exists. Explore a possible angle.
              <br />
              Find one small thing worth testing.
            </p>
          </div>
        </aside>
        <section className="auth-panel" aria-label="Your Hunchlane account">
          {children}
        </section>
      </div>
    </main>
  );
}
