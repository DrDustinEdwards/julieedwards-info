import { experience } from "@/content/site";

export default function Experience() {
  return (
    <section id="experience">
      <div className="wrap">
        <div className="sec-head reveal">
          <div className="eyebrow">Experience</div>
          <h2>What I bring to the board.</h2>
        </div>
        <div className="exp-list">
          {experience.map((e) => (
            <div className="exp-item reveal" key={e.title}>
              <h3>
                {e.title}
                <span className="rule" />
              </h3>
              <p>{e.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
