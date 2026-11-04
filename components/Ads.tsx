import { ADS, type Ad } from "@/lib/ads";

function Visual({ ad }: { ad: Ad }) {
  if (!ad.image) return null;
  if (ad.image.endsWith(".svg")) {
    return (
      <div className="promo-mark">
        <img src={ad.image} alt="" />
      </div>
    );
  }
  return (
    <div className="promo-shot">
      <img src={ad.image} alt="" loading="lazy" />
    </div>
  );
}

export function AdCards() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head">
          <h2 className="h2">More from M&amp;S</h2>
        </div>
        <div className="promo-grid">
          {ADS.map((ad) => (
            <a
              key={ad.id}
              href={ad.href}
              target="_blank"
              rel="noopener sponsored"
              className="promo"
              style={{ background: ad.bg, color: ad.fg }}
            >
              <div className="promo-copy">
                <span className="promo-brand" style={{ color: ad.accent }}>
                  {ad.brand}
                </span>
                <h3>{ad.title}</h3>
                <p>{ad.text}</p>
                <span className="promo-cta">{ad.cta} &rarr;</span>
              </div>
              <Visual ad={ad} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// Slim full-width banner, used between product rows.
export function AdStrip({ index = 0 }: { index?: number }) {
  const ad = ADS[index % ADS.length];
  return (
    <a href={ad.href} target="_blank" rel="noopener sponsored" className="promo-strip" style={{ background: ad.bg, color: ad.fg }}>
      <div className="promo-strip-copy">
        <span className="promo-brand" style={{ color: ad.accent }}>
          {ad.brand}
        </span>
        <strong>{ad.title}</strong>
      </div>
      <span className="promo-strip-cta">{ad.cta} &rarr;</span>
      {ad.image && !ad.image.endsWith(".svg") && <img src={ad.image} alt="" loading="lazy" />}
    </a>
  );
}
