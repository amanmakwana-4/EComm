import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getSupabaseClient } from "@/integrations/supabase/client";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) {
          setError("Client not initialized");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (error) {
          console.error("Failed to fetch order:", error);
          setError(error.message || "Failed to load order");
        } else {
          setOrder(data);
        }
      } catch (e) {
        console.error("Unexpected error fetching order:", e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="p-12 text-center max-w-2xl">
          <CheckCircle className="w-20 h-20 text-[hsl(var(--royal-gold))] mx-auto mb-6" />
          
          <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
          
          <p className="text-muted-foreground mb-2">
            Thank you for your order. Your order has been received and is being processed.
          </p>
          
          {orderId && (
            <p className="text-sm text-muted-foreground mb-8">
              Order ID: <span className="font-mono font-semibold">{orderId.substring(0, 8)}</span>
            </p>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground mb-4">Loading order details…</p>
          )}

          {error && (
            <p className="text-sm text-destructive mb-4">Failed to load order: {error}</p>
          )}

          {order && (
            <div className="text-left mb-6">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2 mb-3">
                {Array.isArray(order.items) && order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{it.product_name || it.name}</div>
                      <div className="text-xs text-muted-foreground">{it.size}</div>
                    </div>
                    <div className="text-right">
                      <div>₹{(it.price || 0).toFixed(2)} x {it.quantity}</div>
                      <div className="font-semibold">₹{((it.price || 0) * (it.quantity || 1)).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{(order.total_price || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-2">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ You will receive an order confirmation email shortly</li>
              <li>✓ Your order will be packed within 24 hours</li>
              <li>✓ Expected delivery: 3-5 business days</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground">
                Back to Home
              </Button>
            </Link>
            <Link to="/product">
              <Button size="lg" variant="outline">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
