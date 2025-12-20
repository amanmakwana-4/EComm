import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPincode, setGuestPincode] = useState("");
  const [guestSearchLoading, setGuestSearchLoading] = useState(false);
  const [guestSearchError, setGuestSearchError] = useState("");
  const [guestSearchFilters, setGuestSearchFilters] = useState(null);
  const [offset, setOffset] = useState(0);
  const [pageSize] = useState(5);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchGuestOrders = async ({ email, pincode, start = 0, append = false }) => {
    const payload = {
      email,
      pincode,
      start,
      limit: pageSize,
    };

    const { data, error } = await supabase.functions.invoke("find-orders", { body: payload });
    if (error) throw error;

    const fetched = (data && data.orders) || [];
    if (append) setOrders((prev) => [...prev, ...fetched]);
    else setOrders(fetched);

    setHasMore(Array.isArray(fetched) && fetched.length === pageSize);
    setOffset(start + fetched.length);
  };

  const fetchOrders = async ({ userId, userEmail, start = 0, append = false, filters = {} }) => {
    try {
      if (userId) {
        const rangeStart = start;
        const rangeEnd = start + pageSize - 1;

        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .range(rangeStart, rangeEnd);

        if (error) throw error;

        if (append) setOrders((prev) => [...prev, ...(data || [])]);
        else setOrders(data || []);

        setHasMore(Array.isArray(data) && data.length === pageSize);
        setOffset(start + (data ? data.length : 0));
        return;
      }

      if (userEmail) {
        await fetchGuestOrders({
          email: userEmail,
          pincode: filters.pincode,
          start,
          append,
        });
        return;
      }

      setOrders([]);
      setHasMore(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      const msg = (error?.message || "").toString().toLowerCase();
      const isTransient = msg.includes("500") || msg.includes("timeout") || msg.includes("network");
      if (isTransient) {
        try {
          await new Promise((res) => setTimeout(res, 300));
          await fetchOrders({ userId, userEmail, start, append, filters });
          return;
        } catch (e) {
          console.error("Retry failed:", e);
        }
      }
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleGuestSearch = async (e) => {
    e.preventDefault();
    const trimmedEmail = guestEmail.trim();
    const trimmedPincode = guestPincode.trim();

    if (!trimmedEmail) {
      setGuestSearchError("Email is required");
      return;
    }

    setGuestSearchError("");
    setGuestSearchFilters({ email: trimmedEmail, pincode: trimmedPincode || undefined });
    setOrders([]);
    setOffset(0);
    setHasMore(false);
    setGuestSearchLoading(true);

    try {
      await fetchOrders({
        userEmail: trimmedEmail,
        start: 0,
        append: false,
        filters: { pincode: trimmedPincode || undefined },
      });
    } finally {
      setGuestSearchLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore) return;
    if (!user && !guestSearchFilters?.email) return;

    setLoadingMore(true);

    if (user) {
      await fetchOrders({ userId: user.id, userEmail: user.email, start: offset, append: true });
    } else if (guestSearchFilters?.email) {
      await fetchOrders({
        userEmail: guestSearchFilters.email,
        start: offset,
        append: true,
        filters: { pincode: guestSearchFilters.pincode },
      });
    }

    setLoadingMore(false);
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      await new Promise((res) => setTimeout(res, 600));
      const { data: { session: session2 } } = await supabase.auth.getSession();
      if (!session2) {
        setGuestMode(true);
        setUser(null);
        setOrders([]);
        setHasMore(false);
        setOffset(0);
        setLoading(false);
        return;
      }
      setGuestMode(false);
      setUser(session2.user);
      setOffset(0);
      setHasMore(false);
      fetchOrders({ userId: session2.user.id, userEmail: session2.user.email, start: 0, append: false });
      return;
    }

    setGuestMode(false);
    setUser(session.user);
    setOffset(0);
    setHasMore(false);
    fetchOrders({ userId: session.user.id, userEmail: session.user.email, start: 0, append: false });
  };

  const getStatusColor = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "packed":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="grow container mx-auto px-4 py-12">
          <div className="text-center">Loading your orders...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {guestMode && (
          <Card className="p-6 mb-6 space-y-4">
            <h2 className="text-xl font-semibold">Track guest orders</h2>
            <p className="text-sm text-muted-foreground">
              You can place orders without signing in and still view them. Enter the email you used while placing the order and optionally the pincode to load your history.
            </p>
            <form onSubmit={handleGuestSearch} className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="guest-email">Email</Label>
                <Input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  required
                />
                {guestSearchError && (
                  <p className="text-sm text-destructive">{guestSearchError}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="guest-pincode">Pincode (optional)</Label>
                <Input
                  id="guest-pincode"
                  value={guestPincode}
                  onChange={(e) => setGuestPincode(e.target.value)}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-2 md:flex-row md:items-center">
                <Button
                  type="submit"
                  disabled={guestSearchLoading}
                  className="w-full bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
                >
                  {guestSearchLoading ? "Searching..." : "Find Orders"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/auth")}
                >
                  Log in to view full history
                </Button>
              </div>
            </form>
          </Card>
        )}

        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {guestMode
                ? guestSearchFilters
                  ? "We couldn't find any orders that match that email/pincode combination."
                  : "Search above with your email to see orders placed as a guest."
                : "You haven't placed any orders yet"}
            </p>
            <button
              onClick={() => navigate("/product")}
              className="text-[hsl(var(--royal-gold))] hover:underline"
            >
              Start Shopping
            </button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Order #{String(order.id).slice(0, 8)}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Placed on {new Date(order.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                    {(order.status || "").toUpperCase()}
                  </Badge>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold mb-2">Items:</h3>
                  {Array.isArray(order.items) && order.items.map((item, index) => {
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    return (
                      <div key={index} className="flex justify-between py-2">
                        <span>{item.product_name || item.name} x {item.quantity}</span>
                        <span>₹{itemTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div className="border-t mt-2 pt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{(Array.isArray(order.items) 
                        ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
                        : 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Charge:</span>
                      <span>₹{((order.total_price || 0) - (Array.isArray(order.items) 
                        ? order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
                        : 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold mb-2">Delivery Address:</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.address}
                        <br />
                        Pincode: {order.pincode}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Contact:</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name}
                        <br />
                        {order.phone}
                        <br />
                        {order.email}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Payment Method:</span>
                      <span className="text-muted-foreground">
                        {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                      <span>Total Amount:</span>
                      <span className="text-[hsl(var(--royal-gold))]">
                        ₹{Number(order.total_price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.status?.toLowerCase() === "delivered" && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        onClick={() => navigate("/product")}
                        className="w-full bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold))]/90 text-white"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Write a Review
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {hasMore && (
              <div className="text-center">
                <button
                  className="mt-4 inline-flex items-center px-4 py-2 bg-[hsl(var(--royal-gold))] text-white rounded"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
            {!hasMore && orders.length > 0 && (
              <div className="text-center text-sm text-muted-foreground mt-4">No more orders</div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyOrders;
