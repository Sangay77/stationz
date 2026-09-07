import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ServiceItem } from "@/lib/types";
import { brand } from "@/lib/brand";

function serviceImage(service: ServiceItem) {
  return service.imageUrl || service.image || brand.aboutImage;
}

export function ServiceCard({ service }: { service: ServiceItem }) {
  return (
    <Link href={`/book?service=${service.slug}`} className="group block">
      <div
        className="media-frame aspect-[4/3] bg-cover bg-center transition duration-500 group-hover:brightness-[0.97]"
        style={{ backgroundImage: `url('${serviceImage(service)}')` }}
      />
      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[1.35rem] text-ink transition group-hover:text-primary sm:text-xl">
            {service.name}
          </h3>
          <ArrowUpRight className="size-4 shrink-0 text-primary/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {service.shortDescription}
        </p>
        <p className="mt-4 text-xs font-bold tracking-[0.14em] text-accent uppercase">
          Book this clean
        </p>
      </div>
    </Link>
  );
}
