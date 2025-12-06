import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch all reviews for a specific product
 * Joins with profiles to get user name
 */
export const useProductReviews = (productId) => {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      if (!productId) return [];
      
      try {
        // Get reviews from database with user_name field
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, user_id, product_id, rating, comment, created_at, user_name")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (reviewsError) return [];
        if (!reviewsData || reviewsData.length === 0) return [];
        
        // Get user IDs that don't have a user_name
        const userIdsNeedingNames = reviewsData
          .filter(review => !review.user_name)
          .map(review => review.user_id);
        
        // Batch fetch customer names from orders for users without stored names
        let customerNames = {};
        if (userIdsNeedingNames.length > 0) {
          const { data: ordersData } = await supabase
            .from("orders")
            .select("user_id, customer_name")
            .in("user_id", userIdsNeedingNames);
          
          // Create a map of user_id to customer_name
          if (ordersData) {
            ordersData.forEach(order => {
              if (order.user_id && order.customer_name && !customerNames[order.user_id]) {
                customerNames[order.user_id] = order.customer_name;
              }
            });
          }
        }
        
        // Map reviews - prefer stored user_name, fallback to orders lookup
        const reviewsWithNames = reviewsData.map((review) => {
          const userName = review.user_name || customerNames[review.user_id] || null;
          return {
            ...review,
            user_name: userName
          };
        });
        
        return reviewsWithNames;
      } catch (err) {
        return [];
      }
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    retry: 1,
  });
};

/**
 * Fetch review statistics (count + average) for a product
 */
export const useReviewStats = (productId) => {
  return useQuery({
    queryKey: ["review-stats", productId],
    queryFn: async () => {
      if (!productId) return { review_count: 0, average_rating: 0 };
      
      const { data, error } = await supabase
        .from("product_review_stats")
        .select("*")
        .eq("product_id", productId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      
      return data || { review_count: 0, average_rating: 0 };
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Fetch top N most recent reviews for a product (for homepage testimonials)
 */
export const useTopReviews = (productId, limit = 3) => {
  return useQuery({
    queryKey: ["top-reviews", productId, limit],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Check if current user can review a product
 * (must have a delivered order containing the product)
 */
export const useCanReview = (productId, userId) => {
  return useQuery({
    queryKey: ["can-review", productId, userId],
    queryFn: async () => {
      if (!productId || !userId) return false;
      
      const { data, error } = await supabase
        .rpc("can_user_review_product", {
          p_user_id: userId,
          p_product_id: productId,
        });

      if (error) return false;
      
      return data === true;
    },
    enabled: Boolean(productId) && Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Check if user has already reviewed this product
 */
export const useUserReview = (productId, userId) => {
  return useQuery({
    queryKey: ["user-review", productId, userId],
    queryFn: async () => {
      if (!productId || !userId) return null;
      
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: Boolean(productId) && Boolean(userId),
  });
};

/**
 * Submit a new review
 */
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, userId, rating, comment, userName }) => {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          comment,
          user_name: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["top-reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", variables.productId, variables.userId] });
    },
  });
};

/**
 * Update an existing review
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, rating, comment }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update({ rating, comment })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", data.product_id] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", data.product_id] });
      queryClient.invalidateQueries({ queryKey: ["top-reviews", data.product_id] });
      queryClient.invalidateQueries({ queryKey: ["user-review"] });
    },
  });
};

/**
 * Delete a review
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, productId }) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      return { reviewId, productId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["review-stats", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["top-reviews", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["user-review"] });
    },
  });
};
