import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";

const Cart = () => {
  const { items, updateQuantity, removeItem, total } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <>
        <Seo
          title="Cart | Royal Pure Spices"
          description="Your cart at Royal Pure Spices. Add authentic hing to proceed to checkout."
          path="/cart"
        />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to get started!</p>
            <Link to="/product">
              <Button size="lg">Browse Products</Button>
            </Link>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Shopping Cart | Royal Pure Spices"
        description="Review your handpicked natural hing before placing an order with Royal Pure Spices."
        path="/cart"
      />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.cartId} className="p-6">
                <div className="flex gap-6">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  
                  <div className="grow">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    {item.size && (
                      <div className="text-sm text-muted-foreground mb-2">Size: {item.size}</div>
                    )}
                    <p className="text-[hsl(var(--royal-gold))] font-semibold text-xl mb-4">
                      ₹{item.price}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.cartId)}
                        className="ml-auto text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div>
              <Card className="p-6 sticky top-20">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{total.toFixed(2)}</span>
                </div>
                {/* compute shipping total: flat per order (₹100) unless any item size >=50g then FREE */}
                {(() => {
                  const DELIVERY_CHARGE = 100;
                  const hasEligibleForFree = items.some((it) => {
                    const sizeLabel = (it.size || "").toString();
                    const sizeNum = parseInt(sizeLabel.replace(/[^0-9]/g, "") || "0", 10);
                    return sizeNum >= 50;
                  });

                  const shippingTotal = hasEligibleForFree ? 0 : DELIVERY_CHARGE;
                  const grandTotal = total + shippingTotal;

                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="font-semibold text-[hsl(var(--royal-gold))]">
                          {shippingTotal === 0 ? "FREE" : `₹${shippingTotal.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-xl">
                          <span className="font-bold">Total</span>
                          <span className="font-bold text-[hsl(var(--royal-gold))]">₹{grandTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <Button 
                size="lg" 
                className="w-full bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </Button>
              
              <Link to="/product">
                <Button variant="outline" className="w-full mt-4">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default Cart;
