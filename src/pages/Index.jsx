import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, ShoppingCart, Shield, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@/assets/hero-spices.jpg";
import productImage from "@/assets/productImage.jpeg";

// Feature flag: enable DB-backed variants if VITE_USE_DB_VARIANTS=true
const useDbVariantsFlag = import.meta.env.VITE_USE_DB_VARIANTS === "true";
const fallbackSizes = [
  { label: "10g", price: 140 },
  { label: "25g", price: 350 },
  { label: "50g", price: 700 },
  { label: "100g", price: 1400 },
];
const deliveryCharge = 100;

const Index = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0); // default 10g

  const { data: product } = useQuery({
    queryKey: ["product"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // fetch variants from DB when feature flag is enabled
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ["product-variants", product?.id],
    enabled: Boolean(product) && useDbVariantsFlag,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("size,price")
        .eq("product_id", product.id);
      if (error) throw error;
      return data;
    },
  });

  // Memoize sizes to prevent recalculation
  const sizes = useMemo(() => 
    variants && variants.length > 0
      ? variants.map((v) => ({ label: v.size, price: Number(v.price) }))
      : fallbackSizes,
    [variants]
  );

  // Memoize add to cart handler
  const handleAddToCart = useCallback(() => {
    if (product) {
      const selected = sizes[selectedSizeIndex];
      addItem({
        id: product.id,
        name: `${product.name} (${selected.label})`,
        price: selected.price,
        size: selected.label,
        image: productImage,
        deliveryCharge,
      });
    }
  }, [product, sizes, selectedSizeIndex, addItem]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Premium Spices" 
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/50" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            Natural Premium <span className="text-[hsl(var(--royal-gold))]">Hing</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Experience pure asafoetida with authentic aroma and unmatched quality
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/product">
              <Button size="lg" className="bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground font-semibold">
                View Product
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-black hover:bg-white hover:border-black hover:text-red-600"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Shield className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
              <h3 className="font-semibold text-lg mb-2">100% Pure & Natural</h3>
              <p className="text-sm text-muted-foreground">
                No additives or preservatives, just pure asafoetida
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Star className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
              <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
              <p className="text-sm text-muted-foreground">
                Sourced from the finest quality resin for authentic flavor
              </p>
            </Card>
            
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Truck className="w-12 h-12 mx-auto mb-4 text-[hsl(var(--royal-gold))]" />
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Quick and secure delivery to your doorstep
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
              <img 
                src={productImage} 
                alt="Natural Premium Hing" 
                className="w-full max-w-md rounded-lg shadow-xl object-cover"
                loading="lazy"
                decoding="async"
                width={400}
                height={400}
              />
            </div>
            
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Natural Premium Hing</h2>
                <p className="text-lg text-muted-foreground mb-6">{product?.short_description}</p>

                <div className="mb-4">
                  {(() => {
                    const selected = sizes[selectedSizeIndex];
                    const sizeNum = parseInt((selected.label || "").replace(/[^0-9]/g, "") || "0", 10);
                    const originalTotal = selected.price + deliveryCharge;

                    return (
                      <div className="flex items-center gap-4">
                        {sizeNum >= 50 ? (
                          <>
                            <span className="text-sm text-muted-foreground line-through">₹{originalTotal}</span>
                            <span className="text-3xl font-bold text-[hsl(var(--royal-gold))]">₹{selected.price}</span>
                            <span className="ml-2 text-sm text-[hsl(var(--royal-gold))] font-semibold">Free delivery</span>
                          </>
                        ) : (
                          <>
                            <span className="text-3xl font-bold text-[hsl(var(--royal-gold))]">₹{selected.price}</span>
                            <span className="text-sm text-muted-foreground">+ ₹{deliveryCharge} delivery</span>
                          </>
                        )}
                      </div>
                    );
                  })()}

                    <div className="mt-3 flex items-center gap-2">
                      {useDbVariantsFlag && variantsLoading && (
                        <span className="inline-flex items-center mr-2 text-sm text-muted-foreground">
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          Loading variants...
                        </span>
                      )}
                      {sizes.map((s, idx) => (
                        <button
                          key={s.label}
                          onClick={() => setSelectedSizeIndex(idx)}
                          className={`px-2 py-1 rounded-md border text-sm ${
                            idx === selectedSizeIndex ? "bg-[hsl(var(--royal-gold))] text-foreground" : "bg-transparent"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-xl mb-3">Benefits:</h3>
                  <ul className="space-y-2">
                    {product?.benefits?.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="w-5 h-5 text-[hsl(var(--royal-gold))] mr-2 mt-0.5 shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    className="bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground font-semibold"
                    onClick={() => {
                      handleAddToCart();
                      navigate("/cart");
                    }}
                  >
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-black text-black"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Priya Sharma",
                text: "The aroma is absolutely authentic! Best quality hing I've ever used.",
                rating: 5
              },
              {
                name: "Rajesh Kumar",
                text: "Pure and natural, just as promised. My family loves the authentic taste.",
                rating: 5
              },
              {
                name: "Anita Patel",
                text: "Fast delivery and excellent packaging. The quality is outstanding!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))]" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <p className="font-semibold">- {testimonial.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                question: "Is this pure asafoetida?",
                answer: "Yes. Our hing is made from naturally sourced resin and processed without additives, fillers, or artificial preservatives."
              },
              {
                question: "How should I store it?",
                answer: "Keep it in a cool, dry place in an airtight container to maintain its aroma and freshness."
              },
              {
                question: "What is the shelf life?",
                answer: "When stored properly, the aroma and quality remain best for up to 12 months."
              },
              {
                question: "Do you offer Cash on Delivery?",
                answer: "Yes, we provide Cash on Delivery (COD)"
              }
            ].map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
