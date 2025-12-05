import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, Users, IndianRupee, ShoppingCart, LogOut, Eye, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const ORDERS_PER_PAGE = 15;

const Admin = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      order.customer_name?.toLowerCase().includes(query) ||
      order.email?.toLowerCase().includes(query) ||
      order.phone?.includes(query) ||
      order.id.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    // Wait for session to be available and use getSession (more reliable for client JWT)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/admin/login");
      return;
    }

    setUser(session.user);

    // Attempt to read user_roles with a small retry to avoid transient 500s during policy updates
    const tryGetRole = async (attempt = 1) => {
      try {
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();

        if (error) throw error;

        return roles;
      } catch (err) {
        // Only retry on server errors (500) or transient network issues
        const isTransient = err?.message?.toString().includes("500") || err?.message?.toString().toLowerCase().includes("timeout") || err?.status === 500;
        if (isTransient && attempt < 3) {
          // small backoff before retrying
          await new Promise((res) => setTimeout(res, 200 * attempt));
          return tryGetRole(attempt + 1);
        }
        // Not transient or out of retries — surface to caller
        throw err;
      }
    };

    try {
      const roles = await tryGetRole();
      if (!roles) {
        // Do not show a loud toast here; redirect quietly so user sees a consistent UX
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchOrders();
    } catch (err) {
      console.error("Admin role check failed (transient-safe):", err);
      navigate("/");
    }
  };

  const fetchOrders = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setOrders([]);
    }
    try {
      const offset = loadMore ? orders.length : 0;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + ORDERS_PER_PAGE - 1);

      if (error) {
        console.error("Failed to fetch orders:", error);
        if (!loadMore) setOrders([]);
        return;
      }
      
      const newOrders = data || [];
      if (loadMore) {
        setOrders((prev) => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      setHasMore(newOrders.length === ORDERS_PER_PAGE);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(true);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      await fetchOrders();
      toast.success("Order status updated");
    } catch (err) {
      console.error("Failed to update order status:", err);
      setOrders(previous);
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      packed: "bg-blue-100 text-blue-800 border-blue-300",
      shipped: "bg-purple-100 text-purple-800 border-purple-300",
      delivered: "bg-green-100 text-green-800 border-green-300",
    };
    return (
      <Badge className={colors[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const uniqueCustomers = new Set(orders.map(o => o.email)).size;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-xl p-6 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-2 text-red-600">Access denied - Admin privileges required</h3>
          <p className="text-sm text-muted-foreground mb-4">Your account does not have admin role.</p>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Signed-in user:</p>
            <p className="font-mono text-sm">ID: {user?.id || "(not signed in)"}</p>
            <p className="font-mono text-sm">Email: {user?.email || "(not signed in)"}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/login')}>Go to Login</Button>
            <Button size="sm" onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[hsl(var(--royal-gold))]">Royal Pure Spices - Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[hsl(var(--royal-gold))]/10 rounded-full">
                <IndianRupee className="h-6 w-6 text-[hsl(var(--royal-gold))]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Customers</p>
                <p className="text-2xl font-bold">{uniqueCustomers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">₹{todayRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{orders.filter(o => o.status === "packed").length}</p>
            <p className="text-sm text-muted-foreground">Packed</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{orders.filter(o => o.status === "shipped").length}</p>
            <p className="text-sm text-muted-foreground">Shipped</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{deliveredOrders}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </Card>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Card>
            <div className="p-6 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold">All Orders</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">Loading orders...</TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        {orders.length === 0 ? "No orders yet" : "No orders match your search/filter"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.email}</p>
                          </div>
                        </TableCell>
                        <TableCell><p className="text-sm">{order.phone}</p></TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                {Array.isArray(order.items) ? order.items.length : 0} items
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Customer Info</h4>
                                  <p><strong>Name:</strong> {order.customer_name}</p>
                                  <p><strong>Email:</strong> {order.email}</p>
                                  <p><strong>Phone:</strong> {order.phone}</p>
                                  <p><strong>Address:</strong> {order.address}</p>
                                  <p><strong>Pincode:</strong> {order.pincode}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Items</h4>
                                  {Array.isArray(order.items) && order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between py-1 border-b">
                                      <span>{item.name} x {item.quantity}</span>
                                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between py-2 font-bold">
                                    <span>Total</span>
                                    <span>₹{(order.total_price || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="font-semibold">₹{(order.total_price || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.payment_method === "cod" ? "COD" : "Online"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(order.created_at), "dd MMM yyyy")}<br />
                          <span className="text-xs text-muted-foreground">{format(new Date(order.created_at), "HH:mm")}</span>
                        </TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="packed">Packed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Load More Button - Desktop */}
            {!loading && orders.length > 0 && hasMore && (
              <div className="p-4 border-t text-center">
                <Button variant="outline" onClick={loadMoreOrders} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load More Orders"}
                </Button>
              </div>
            )}
            {!loading && orders.length > 0 && !hasMore && (
              <div className="p-4 border-t text-center text-sm text-muted-foreground">
                All orders loaded ({orders.length} total)
              </div>
            )}
          </Card>
        </div>

        {/* Mobile: Card list */}
        <div className="block sm:hidden space-y-4">
          {/* Mobile Search and Filter */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-3">All Orders</h2>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {loading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              {orders.length === 0 ? "No orders yet" : "No orders match your search/filter"}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{order.id.slice(0,8).toUpperCase()}</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                    <p className="mt-2 text-sm font-semibold">₹{(order.total_price || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(order.created_at), "dd MMM yyyy HH:mm")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div>{getStatusBadge(order.status)}</div>
                    <Select value={order.status} onValueChange={(v) => updateOrderStatus(order.id, v)}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">Details</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Order Details - #{order.id.slice(0,8).toUpperCase()}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Customer Info</h4>
                            <p><strong>Name:</strong> {order.customer_name}</p>
                            <p><strong>Email:</strong> {order.email}</p>
                            <p><strong>Phone:</strong> {order.phone}</p>
                            <p><strong>Address:</strong> {order.address}</p>
                            <p><strong>Pincode:</strong> {order.pincode}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Items</h4>
                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-1 border-b">
                                <span>{item.name} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between py-2 font-bold">
                              <span>Total</span>
                              <span>₹{(order.total_price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))
          )}
          {/* Load More Button - Mobile */}
          {!loading && orders.length > 0 && hasMore && (
            <div className="text-center py-4">
              <Button variant="outline" onClick={loadMoreOrders} disabled={loadingMore} className="w-full">
                {loadingMore ? "Loading..." : "Load More Orders"}
              </Button>
            </div>
          )}
          {!loading && orders.length > 0 && !hasMore && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              All orders loaded ({orders.length} total)
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;