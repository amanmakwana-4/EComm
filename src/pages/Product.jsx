import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import productImage from "@/assets/productImage.jpeg";

const Product = () => {
  const [quantity, setQuantity] = useState(1);
  const deliveryCharge = 100; // default delivery charge per item
  const useDbVariants = import.meta.env.VITE_USE_DB_VARIANTS === "true";

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

  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ["product-variants", product?.id],
    enabled: Boolean(product) && useDbVariants,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("size,price")
        .eq("product_id", product.id);
      if (error) throw error;
      return data;
    },
  });

  const sizes = variants && variants.length > 0
    ? variants.map((v) => ({ label: v.size, price: Number(v.price) }))
    : [
        { label: "10g", price: 140 },
        { label: "25g", price: 350 },
        { label: "50g", price: 700 },
        { label: "100g", price: 1400 },
      ];
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0); // default 10g
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (product) {
      const selected = sizes[selectedSizeIndex];
      for (let i = 0; i < quantity; i++) {
        addItem({
          id: product.id,
          name: `${product.name} (${selected.label})`,
          price: selected.price,
          size: selected.label,
          image: productImage,
          deliveryCharge,
        });
      }
      toast.success(`Added ${quantity} item(s) to cart`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="grow container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <img 
              src={productImage}
              alt={product.name}
              className="w-full max-w-md rounded-lg shadow-xl object-cover mx-auto"
            />
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))]" />
                ))}
              </div>
              <span className="text-muted-foreground">(50+ reviews)</span>
            </div>

            <div className="mb-6">
              {(() => {
                const selected = sizes[selectedSizeIndex];
                const sizeNum = parseInt((selected.label || "").replace(/[^0-9]/g, "") || "0", 10);
                const originalTotal = selected.price + deliveryCharge;

                return (
                  <>
                    <div className="flex items-baseline gap-3">
                      {sizeNum >= 50 ? (
                        <>
                          <span className="text-sm text-muted-foreground line-through">₹{originalTotal}</span>
                          <span className="text-4xl font-bold text-[hsl(var(--royal-gold))]">₹{selected.price}</span>
                          <span className="ml-2 text-sm text-[hsl(var(--royal-gold))] font-semibold">Free delivery</span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-[hsl(var(--royal-gold))]">₹{selected.price}</span>
                          <span className="text-sm text-muted-foreground">+ ₹{deliveryCharge} delivery</span>
                        </>
                      )}

                      <span className="text-muted-foreground ml-2">/ {selected.label}</span>
                    </div>

                    {/* Size selector */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {useDbVariants && variantsLoading && (
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
                          className={`px-3 py-1 rounded-md border transition-colors text-sm ${
                            idx === selectedSizeIndex
                              ? "bg-[hsl(var(--royal-gold))] text-foreground border-[hsl(var(--royal-gold))]"
                              : "bg-transparent text-foreground/90 border-border"
                          }`}
                        >
                          {s.label} - ₹{s.price}
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            <p className="text-lg mb-6">{product.description}</p>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button 
                size="lg" 
                className="flex-1 bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {/* Benefits */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold text-xl mb-4">Key Benefits</h3>
              <ul className="space-y-3">
                {product.benefits?.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <Star className="w-5 h-5 text-[hsl(var(--royal-gold))] mr-2 mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Usage Instructions */}
            <Card className="p-6">
              <h3 className="font-semibold text-xl mb-4">How to Use</h3>
              <p className="text-muted-foreground">{product.usage_instructions}</p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Product;
