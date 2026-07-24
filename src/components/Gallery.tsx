import Image from "next/image";
import Reveal from "@/components/Reveal";

export default function Gallery() {
  const items = [
    { src: "/1_(2)_1671424715600.avif", label: "Auditorium" },
    { src: "/3_(1)_1671424648485.avif", label: "Projection" },
    { src: "/images.jpeg", label: "Lobby" },
    { src: "/hero-cinema.png", label: "Exterior" },
  ];

  return (
    <section id="gallery" className="bg-background py-12 sm:py-16">
      <Reveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-title">GALLERY</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
          Glimpses of the Sri Murugan Cinema experience.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="group relative aspect-square overflow-hidden rounded-xl border border-card-border"
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
