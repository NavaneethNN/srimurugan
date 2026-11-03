import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NowShowing from "@/components/NowShowing";
import ComingSoon from "@/components/ComingSoon";
import CafeShowcase from "@/components/CafeShowcase";
import Features from "@/components/Facilities";
import Projection from "@/components/Projection";
import DolbyAtmos from "@/components/DolbyAtmos";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import Footer from "@/components/Footer";
import SectionScrollHandler from "@/components/SectionScrollHandler";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export const revalidate = 60;

export default function Home() {
  return (
    <div className="site-light flex flex-1 flex-col">
      <Suspense fallback={null}>
        <SectionScrollHandler />
      </Suspense>
      <Header />
      <main className="flex-1">
        <Hero />
        <NowShowing />
        <ComingSoon />
        <CafeShowcase />
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
