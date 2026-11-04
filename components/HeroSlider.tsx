"use client";
import { img } from "@/lib/img";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Slide = {
  kicker: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  bg: string;
  images: string[];
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current && document.visibilityState === "visible") go(active + 1);
    }, 6000);
    return () => clearInterval(t);
  });

  return (
    <section
      className="hero"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
    >
      <div className="wrap">
        <div className="hero-track" ref={track}>
          {slides.map((s, i) => (
            <div className="slide" key={s.href} style={{ background: s.bg }} aria-hidden={i !== active}>
              <div className="slide-copy">
                <span className="slide-kicker">{s.kicker}</span>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                <Link href={s.href} className="btn" tabIndex={i === active ? 0 : -1}>
                  {s.cta}
                </Link>
              </div>
              <Link href={s.href} className="slide-imgs" tabIndex={-1} aria-hidden>
                {s.images.slice(0, 3).map((src) => (
                  <img key={src} src={img(src, 600)} alt="" loading={i === 0 ? "eager" : "lazy"} />
                ))}
              </Link>
            </div>
          ))}
        </div>
        <div className="hero-controls">
          <div className="dots">
            {slides.map((s, i) => (
              <button key={s.href} className={i === active ? "on" : ""} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
          <div className="arrows">
            <button onClick={() => go(active - 1)} aria-label="Previous">‹</button>
            <button onClick={() => go(active + 1)} aria-label="Next">›</button>
          </div>
        </div>
      </div>
    </section>
  );
}
