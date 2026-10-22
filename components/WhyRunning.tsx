import { headings, why } from "@/content/site";

const icons = [
  // Education
  <svg key="e" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
  </svg>,
  // Integrity
  <svg key="i" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="m9 15 2 2 4-4" />
  </svg>,
  // Student Success
  <svg key="s" className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" />
  </svg>,
];

export default function WhyRunning() {
  return (
    <section className="why" id="why">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{headings.why}</h2>
        </div>
        <div className="pillars">
          {why.pillars.map((p, i) => (
            <div className="pillar reveal" key={p.title}>
              {icons[i]}
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
        {/* Campaign flyer, hidden while serving. Restore for re-election.
            On restore, re-add `images` to the content/site import.
        <div className="flyer-cta reveal">
          <a className="btn" href={images.flyer || "#"} target={images.flyer ? "_blank" : undefined} rel="noreferrer">
            Download Flyer
          </a>
        </div>
        */}
      </div>
    </section>
  );
}
