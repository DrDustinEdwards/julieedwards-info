import { about, images } from "@/content/site";

export default function About() {
  const imgStyle = images.about
    ? ({ ["--about-img" as string]: `url(${images.about})` } as React.CSSProperties)
    : undefined;
  return (
    <section className="about" id="about">
      <div className="about-grid">
        <div className={`about-img reveal${images.about ? "" : " placeholder"}`} style={imgStyle}>
          {!images.about && <span className="ph">Photo</span>}
        </div>
        <div className="about-panel reveal">
          <h2>
            About Me
            <span className="rule" />
          </h2>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
