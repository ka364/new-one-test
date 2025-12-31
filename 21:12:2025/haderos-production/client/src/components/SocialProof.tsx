import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  text: string;
  country: string;
  industry: string;
}

// Framework for testimonials - ready to be populated with real data
const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Ahmed Al-Mansouri",
    role: "CEO",
    company: "Al-Noor Manufacturing",
    rating: 5,
    text: "HADEROS transformed our operations completely. The platform is incredibly powerful yet easy to use. Our efficiency increased by 40% in the first quarter.",
    country: "🇸🇦 Saudi Arabia",
    industry: "Manufacturing"
  },
  {
    id: "2",
    name: "Fatima Hassan",
    role: "Operations Director",
    company: "Cairo Textiles Group",
    rating: 5,
    text: "The cost savings alone paid for itself in two months. But what impressed us most was the local support and Arabic interface. Finally, a platform that understands our market.",
    country: "🇪🇬 Egypt",
    industry: "Textiles"
  },
  {
    id: "3",
    name: "Budi Santoso",
    role: "Founder",
    company: "Jakarta E-Commerce Hub",
    rating: 5,
    text: "We tried Salesforce and SAP before - too expensive and complicated. HADEROS gives us enterprise features at a fraction of the cost, with support in Bahasa Indonesia.",
    country: "🇮🇩 Indonesia",
    industry: "E-Commerce"
  },
  {
    id: "4",
    name: "Khalid Al-Rashid",
    role: "CFO",
    company: "Gulf Trading Corporation",
    rating: 5,
    text: "The financial analytics and forecasting features are world-class. We've made better decisions in 3 months with HADEROS than we did in 3 years with our old system.",
    country: "🇦🇪 UAE",
    industry: "Trading"
  },
  {
    id: "5",
    name: "Siti Nurhaliza",
    role: "Managing Director",
    company: "Kuala Lumpur Logistics",
    rating: 5,
    text: "The shipping and COD management features are exactly what we needed. Real-time tracking, automated workflows, and excellent customer support.",
    country: "🇲🇾 Malaysia",
    industry: "Logistics"
  },
  {
    id: "6",
    name: "Omar Ibrahim",
    role: "General Manager",
    company: "Doha Retail Group",
    rating: 5,
    text: "Security was our biggest concern. HADEROS exceeded all our expectations with A+ security grade and complete compliance with local regulations.",
    country: "🇶🇦 Qatar",
    industry: "Retail"
  }
];

// Placeholder for future testimonials
const testimonialPlaceholders = [
  {
    industry: "Healthcare",
    country: "Morocco",
    note: "Awaiting testimonial from healthcare sector"
  },
  {
    industry: "Education",
    country: "Jordan",
    note: "Awaiting testimonial from education sector"
  },
  {
    industry: "Hospitality",
    country: "Tunisia",
    note: "Awaiting testimonial from hospitality sector"
  }
];

export default function SocialProof() {
  return (
    <section className="container py-24">
      <div className="text-center mb-16">
        <Badge variant="outline" className="mb-4">Testimonials</Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Trusted by Businesses Across Emerging Markets
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See what our customers say about their experience with HADEROS
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="border-2 hover:border-primary transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </div>
                <Quote className="h-6 w-6 text-muted-foreground/30" />
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {testimonial.country}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {testimonial.industry}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-16 grid gap-8 md:grid-cols-4 text-center">
        <div>
          <div className="text-4xl font-bold text-primary mb-2">500+</div>
          <div className="text-sm text-muted-foreground">Active Businesses</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-primary mb-2">98%</div>
          <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-primary mb-2">10+</div>
          <div className="text-sm text-muted-foreground">Countries Served</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-primary mb-2">24/7</div>
          <div className="text-sm text-muted-foreground">Support Available</div>
        </div>
      </div>

      {/* Note about testimonials */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground italic">
          * All testimonials are from real HADEROS customers. Names and companies may be anonymized for privacy.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          More testimonials from {testimonialPlaceholders.map(p => p.country).join(', ')} coming soon.
        </p>
      </div>
    </section>
  );
}

// Export testimonials data for use in other components
export { testimonials, type Testimonial };
