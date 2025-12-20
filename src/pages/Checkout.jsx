import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  address: z.string().trim().min(10, "Address must be at least 10 characters").max(500),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

const DELIVERY_CHARGE = 100;

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [freeDeliveryFor50Plus, setFreeDeliveryFor50Plus] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const getSizeNumber = (size) => parseInt((size || "").toString().replace(/[^0-9]/g, "") || "0", 10);
  const hasEligibleForFree = items.some((item) => getSizeNumber(item.size) >= 50);

  useEffect(() => {
    // Pre-fill form with user data if logged in
    const loadUserData = async () => {
      if (!user) return;
      try {
        // Validate user.id looks like a UUID before using it in a filter.
        const isValidUuid = typeof user.id === "string" && /^[0-9a-fA-F-]{36}$/.test(user.id);
        if (!isValidUuid) {
          console.warn("Skipping profile fetch because user.id is not a valid UUID:", user?.id);
          setFormData(prev => ({ ...prev, email: user.email || "" }));
          return;
        }

        // Select only known columns to avoid errors if the DB schema is missing optional columns
        const supabase = getSupabaseClient();
        if (!supabase) {
          setFormData(prev => ({ ...prev, email: user.email || "" }));
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name,phone")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          // Log detailed PostgREST error info for diagnosis (code, message, details)
          console.warn("Could not load profile:", {
            message: error.message,
            code: error.code,
            details: error.details,
          });
        }

        if (profile) {
          setFormData({
            name: profile.full_name || "",
            phone: profile.phone || "",
            email: user.email || "",
            address: "",
            pincode: "",
          });
        } else {
          setFormData(prev => ({ ...prev, email: user.email || "" }));
        }
      } catch (e) {
        console.error("Unexpected error loading profile:", e);
        setFormData(prev => ({ ...prev, email: user.email || "" }));
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    if (!hasEligibleForFree && freeDeliveryFor50Plus) {
      setFreeDeliveryFor50Plus(false);
    }
  }, [hasEligibleForFree, freeDeliveryFor50Plus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleCouponChange = (value) => {
    setCouponCode(value);
    if (couponApplied) {
      setCouponApplied(false);
    }
    if (couponMessage) {
      setCouponMessage("");
    }
  };

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim();
    if (!trimmedCode) {
      setCouponMessage("Enter a promo code to apply");
      return;
    }

    setCouponLoading(true);
    setCouponMessage("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client unavailable");
      const { data, error } = await supabase.functions.invoke("validate-promo", { body: { code: trimmedCode } });
      if (error) throw error;
      if (data?.valid) {
        setCouponApplied(true);
        setCouponMessage("Promo applied — delivery charge waived.");
      } else {
        setCouponApplied(false);
        setCouponMessage("Invalid promo code");
      }
    } catch (error) {
      console.error("Coupon validation failed:", error);
      setCouponApplied(false);
      setCouponMessage("Unable to apply promo code right now");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    try {
      checkoutSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
        toast.error("Please fix the form errors");
        return;
      }
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      // Compute local shipping/total for display and emails (server will compute canonical pricing)
      const subtotal = total;
      const eligibleByWeight = freeDeliveryFor50Plus && hasEligibleForFree;
      const shippingTotal = (eligibleByWeight || couponApplied) ? 0 : DELIVERY_CHARGE;
      const finalTotal = subtotal + shippingTotal;

      // Create order server-side via Edge Function to avoid trusting client-side prices
      const payload = {
        customer_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        pincode: formData.pincode,
        // send minimal item info: id, size, quantity
        items: items.map((it) => ({ id: it.id, size: it.size, quantity: it.quantity })),
        payment_method: paymentMethod,
        user_id: user?.id || null,
        freeDeliveryFor50Plus,
        coupon_code: couponApplied ? couponCode.trim() : null,
        coupon_applied: couponApplied,
      };

      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client unavailable");
      const { data, error } = await supabase.functions.invoke("create-order", { body: payload });
      if (error) throw error;

      // The create-order function returns an object like { success: true, order: { ... } }
      // Normalize to the inserted order object for convenient access.
      const createdOrder = (data && data.order) ? data.order : data;

      // Emails are sent server-side by the `create-order` Edge Function (best-effort).
      // Avoid calling `send-order-email` from the browser (it may be intentionally unconfigured
      // // in the function environment and would return a 500). Rely on server-side dispatch instead.
      // console.log("Order created on server (server will handle confirmation emails)", { orderId: createdOrder?.id });

      clearCart();
      toast.success("Order placed successfully!");
      navigate("/order-success", { state: { orderId: createdOrder?.id } });
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

        // Render UI
        return (
      <div className="flex flex-col min-h-screen">
        <Navbar />

        <main className="grow container mx-auto px-4 py-12">
        <Helmet>
          <title>Checkout — Royal Pure Spices Pvt Ltd</title>
          <meta name="description" content="Complete your purchase for Natural Premium Hing. Secure checkout with Cash on Delivery." />
          <link rel="canonical" href="https://e-comm-seven-dun.vercel.app/checkout" />
        </Helmet>
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Details */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Customer Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        maxLength={255}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      maxLength={500}
                      className={errors.address ? "border-destructive" : ""}
                    />
                    {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      maxLength={6}
                      placeholder="6-digit pincode"
                      className={errors.pincode ? "border-destructive" : ""}
                    />
                    {errors.pincode && <p className="text-sm text-destructive mt-1">{errors.pincode}</p>}
                  </div>
                </div>
              </Card>

              {/* Payment Method */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg mb-3">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="grow cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                    <RadioGroupItem value="online" id="online" disabled />
                    <Label htmlFor="online" className="grow">
                      Online Payment (Coming Soon)
                    </Label>
                  </div>
                </RadioGroup>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 sticky top-20">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.cartId ?? item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={freeDeliveryFor50Plus}
                        onChange={(e) => setFreeDeliveryFor50Plus(e.target.checked)}
                      />
                      <span className="text-sm">Apply free delivery for items 50g or more</span>
                    </label>
                    {!hasEligibleForFree && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Add at least one 50g+ variant to unlock this option.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Promo codes occasionally waive delivery: apply one below to see the discount.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Promo code"
                        value={couponCode}
                        onChange={(e) => handleCouponChange(e.target.value)}
                        disabled={couponApplied}
                        maxLength={32}
                      />
                      <Button
                        size="sm"
                        className="bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || couponApplied || !couponCode.trim()}
                      >
                        {couponLoading ? "Applying..." : couponApplied ? "Applied" : "Apply"}
                      </Button>
                    </div>
                    {couponMessage && (
                      <p className="text-xs text-muted-foreground">{couponMessage}</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    {(() => {
                      const subtotal = total;
                      const couponWaivesDelivery = couponApplied;
                      const shippingTotal = couponWaivesDelivery
                        ? 0
                        : items.reduce((sum, it) => {
                            const qty = it.quantity || 0;
                            const sizeValue = getSizeNumber(it.size);
                            const eligibleForFree = freeDeliveryFor50Plus && sizeValue >= 50;
                            const perItemCharge = eligibleForFree ? 0 : (it.deliveryCharge || DELIVERY_CHARGE);
                            return sum + perItemCharge * qty;
                          }, 0);

                      const finalTotal = subtotal + shippingTotal;

                      return (
                        <>
                          <div className="flex justify-between mb-2">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between mb-4">
                            <span>Delivery</span>
                            <span className="text-[hsl(var(--royal-gold))]">
                              {shippingTotal === 0 ? "FREE" : `₹${shippingTotal.toFixed(2)}`}
                            </span>
                          </div>
                          {couponApplied && (
                            <p className="text-xs text-[hsl(var(--royal-gold))] mb-2">Promo code applied &ndash; delivery waived.</p>
                          )}
                          <div className="flex justify-between text-xl font-bold">
                            <span>Total</span>
                            <span className="text-[hsl(var(--royal-gold))]">₹{finalTotal.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Button 
                  type="submit"
                  size="lg" 
                  className="w-full bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
                  disabled={loading}
                >
                  {loading ? "Placing Order..." : "Place Order"}
                </Button>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
