import { Card } from "@/components/ui/card";
import { Award, Heart, Leaf, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";

const ABOUT_META = {
  title: "About Royal Pure Spices",
  description: "Learn how Royal Pure Spices sources and crafts premium natural hing for your kitchen.",
  path: "/about",
};

const About = () => {
  return (
    <>
      <Seo {...ABOUT_META} />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="grow">
        {/* Hero Section */}
        <section className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Royal Pure Spices</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Bringing authentic flavors and premium quality spices to your kitchen since our inception
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-1 container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">
              🌿 Our Story — The Heart Behind Royal Pure Spices
            </h2>

            <p className="text-lg text-muted-foreground mb-4">
              Royal Pure Spices began with a simple yet powerful vision — to bring premium, authentic, 
              and naturally sourced spices to every Indian household. We believe great food starts with 
              honest ingredients, and that belief reflects in everything we do.
            </p>

            <p className="text-lg text-muted-foreground mb-4">
              Our flagship product, <strong>Natural Premium Hing</strong>, is sourced from the finest-quality 
              resin and processed using traditional methods passed down through generations. Every pinch delivers 
              pure aroma, richness, and depth of flavor — exactly the way real Hing is meant to be.
            </p>

            <p className="text-lg text-muted-foreground mb-4">
              As our reputation grew, so did the trust placed in us by families across India. Today, Royal Pure 
              Spices stands as a brand chosen by people who value authenticity, tradition, and reliability in 
              their kitchen.
            </p>

            <p className="text-lg text-muted-foreground">
              From sourcing to packaging, every step is guided by transparency and unmatched quality standards. 
              We take pride in offering spices that are natural, pure, safe, and consistently superior — 
              making every dish more flavorful and every kitchen more confident.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="p-6 text-center">
                <Leaf className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
                <h3 className="font-semibold text-lg mb-2">Natural & Pure</h3>
                <p className="text-sm text-muted-foreground">
                  100% natural spices with no artificial additives, colors, or preservatives.
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
                <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Sourced from trusted regions and processed with strict quality standards.
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
                <h3 className="font-semibold text-lg mb-2">Customer First</h3>
                <p className="text-sm text-muted-foreground">
                  Your satisfaction guides every decision we make — quality without compromise.
                </p>
              </Card>

              <Card className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
                <h3 className="font-semibold text-lg mb-2">Trust & Transparency</h3>
                <p className="text-sm text-muted-foreground">
                  We maintain honesty from sourcing to packaging, building lasting relationships.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose Royal Pure Spices?</h2>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Authentic Sourcing</h3>
                <p className="text-muted-foreground">
                  We work directly with trusted growers and suppliers, ensuring purity, authenticity,
                  and natural richness in every spice we offer.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  Each batch undergoes rigorous testing for purity, aroma, and consistency so you 
                  receive only the finest spices every time.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  We prioritize quick and secure delivery, ensuring your spices remain fresh and 
                  flavorful when they reach your kitchen.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">Customer Support</h3>
                <p className="text-muted-foreground">
                  Our dedicated support team is always available to assist you with any questions, 
                  orders, or concerns — your comfort matters to us.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-2">A Brand You Can Trust</h3>
                <p className="text-muted-foreground">
                  Through honesty, quality, and consistency, Royal Pure Spices has earned the trust 
                  of countless families. We are committed to delivering only what we ourselves would 
                  proudly use in our homes.
                </p>
              </Card>
            </div>
          </div>
        </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default About;
