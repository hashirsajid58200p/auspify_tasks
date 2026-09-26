export interface JobJsonLdProps {
  job: {
    title: string;
    description: string;
    publishedAt?: string | Date;
    closesAt?: string | Date;
    createdAt?: string | Date;
    type: string;
    locationType: string;
    location: string;
    salaryMin: number;
    salaryMax: number;
    salaryCurrency?: string;
    companyId?: {
      name?: string;
      website?: string;
      logoUrl?: string;
    };
  };
}

export function JobJsonLd({ job }: JobJsonLdProps) {
  const company = job.companyId;
  const postedDate = job.publishedAt || job.createdAt || new Date();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: new Date(postedDate).toISOString(),
    ...(job.closesAt ? { validThrough: new Date(job.closesAt).toISOString() } : {}),
    employmentType: job.type,
    hiringOrganization: {
      "@type": "Organization",
      name: company?.name || "Company",
      ...(company?.website ? { sameAs: company.website } : {}),
      ...(company?.logoUrl ? { logo: company.logoUrl } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
      },
    },
    ...(job.locationType === "REMOTE" ? { jobLocationType: "TELECOMMUTE" } : {}),
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salaryCurrency || "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: "YEAR",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
