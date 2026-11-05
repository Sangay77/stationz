export const brand = {
  name: "STATIONZ",
  shortName: "stationz",
  tagline: "Professional cleaning for homes and workplaces — booked in minutes.",
  support: "Reliable residential, office, and commercial cleaning across Busselton and surrounds.",
  phone: "+61 412 207 114",
  phoneHref: "tel:+61412207114",
  email: "stationz2025@gmail.com",
  emailHref: "mailto:stationz2025@gmail.com",
  address: "15 Burt Street, Broadwater, Busselton, WA, 6280",
  hours: "8:00 — 18:00",
  logo: "/logo.png",
  heroImage: "https://stationz.com.au/wp-content/uploads/2026/08/s5.jpeg",
  aboutImage: "https://stationz.com.au/wp-content/uploads/2022/06/pexels-tima-miroshnichenko-16195277.jpg",
  about:
    "Established in 2023, STATIONZ delivers professional, reliable cleaning for homes, offices, and commercial spaces — tailored to local communities across the Busselton region.",
  aboutExtended:
    "Our trained team uses proven methods and quality products so every visit leaves your space hygienic, fresh, and ready to use. Flexible scheduling, clear communication, and consistent results — every clean.",
  promises: [
    "Trained local cleaners",
    "Flexible bookings — pause anytime",
    "Thorough, consistent results",
  ],
  trustSignals: [
    { label: "Insured team", detail: "Fully covered for peace of mind" },
    { label: "Trained pros", detail: "Vetted local cleaning experts" },
    { label: "Easy booking", detail: "Quote online or call today" },
    { label: "Busselton based", detail: "Serving homes & businesses nearby" },
  ],
  howItWorks: [
    {
      step: "01",
      title: "Request a quote",
      detail: "Tell us your space, preferred day, and service type online or by phone.",
    },
    {
      step: "02",
      title: "Confirm your clean",
      detail: "We confirm timing, pricing, and any special requirements before we arrive.",
    },
    {
      step: "03",
      title: "Enjoy the results",
      detail: "Our team cleans thoroughly and leaves your space fresh and ready.",
    },
  ],
  appointmentBlurb:
    "Book a reliable clean for your home, office, or commercial space — we’ll confirm and arrive ready to work.",
  contactIntro:
    "Need a quote or have a question? Call, email, or send a message — we’ll help you choose the right clean and get it booked.",
} as const;

/** Station Z service copy from stationz.com.au */
export const stationServices = [
  {
    id: 1,
    name: "Commercial Cleaning",
    slug: "commercial-cleaning",
    shortDescription:
      "Eco-friendly cleaning for workplaces and industrial spaces with sustainable products.",
    description:
      "Eco-friendly cleaning solutions for offices, commercial spaces, and industries using sustainable practices and premium products.",
    priceFrom: null as number | null,
    durationMinutes: 180,
    icon: "sparkles",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    featured: true,
    active: true,
    sortOrder: 1,
  },
  {
    id: 2,
    name: "Office Cleaning",
    slug: "office-cleaning",
    shortDescription:
      "Keep desks, meeting rooms, and shared spaces hygienic and ready for work.",
    description:
      "Professional cleaning services for office spaces to maintain hygiene, productivity, and a pleasant work environment.",
    priceFrom: null as number | null,
    durationMinutes: 120,
    icon: "building",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
    featured: true,
    active: true,
    sortOrder: 2,
  },
  {
    id: 3,
    name: "Residential Cleaning",
    slug: "residential-cleaning",
    shortDescription:
      "Home cleans that leave every room fresh, comfortable, and welcoming.",
    description:
      "Reliable home cleaning services that ensure a safe, clean, and comfortable living space for you and your family.",
    priceFrom: null as number | null,
    durationMinutes: 120,
    icon: "home",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    featured: true,
    active: true,
    sortOrder: 3,
  },
] as const;
