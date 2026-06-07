import { profile, images } from "@/content/site";

export default function Hero() {
  const style = images.hero
    ? ({ ["--hero-img" as string]: `url(${images.hero})` } as React.CSSProperties)
    : undefined;
  return (
    <header className="hero" id="top" style={style}>
      <div>
        <div className="eyebrow">Bluff Dale ISD</div>
        <h1>{profile.name}</h1>
        <div className="office">Bluff Dale ISD School Board Trustee</div>
      </div>
    </header>
  );
}
