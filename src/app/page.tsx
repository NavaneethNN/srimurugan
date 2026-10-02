import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NowShowing from "@/components/NowShowing";
import ComingSoon from "@/components/ComingSoon";
import Features from "@/components/Facilities";
import Projection from "@/components/Projection";
import DolbyAtmos from "@/components/DolbyAtmos";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import SectionScrollHandler from "@/components/SectionScrollHandler";

export default function Home() {
  return (
    <div className="site-light flex flex-1 flex-col">
      <SectionScrollHandler />
      <Header />
      <main className="flex-1">
        <Hero />
        <NowShowing />
        <ComingSoon />
        <Projection />
        <DolbyAtmos />
        <Features />
        <About />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
