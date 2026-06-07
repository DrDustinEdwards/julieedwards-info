import Image from "next/image";
import { about, images } from "@/content/site";

export default function About() {
  return (
    <section className="about" id="about">
      <div className="about-grid">
        <div className={`about-img reveal${images.about ? "" : " placeholder"}`}>
          {images.about ? (
            <Image
              src={images.about}
              alt="Julie Edwards"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="ph">Photo</span>
          )}
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
