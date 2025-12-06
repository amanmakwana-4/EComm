import { memo, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCanReview, useUserReview, useSubmitReview, useUpdateReview, useDeleteReview } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/**
 * Interactive star rating selector
 */
const StarSelector = memo(function StarSelector({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))]"
                : "text-gray-300 hover:text-gray-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
});

/**
 * Review form component
 * Only shown if user is eligible to review (has delivered order)
 */
const ReviewForm = memo(function ReviewForm({ productId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: canReview, isLoading: checkingEligibility } = useCanReview(productId, user?.id);
  const { data: existingReview, isLoading: loadingExisting } = useUserReview(productId, user?.id);
  
  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState("");

  // Fetch user's name from orders or profile
  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.id) return;

      // Try to get name from orders first
      const { data: orderData } = await supabase
        .from("orders")
        .select("customer_name")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (orderData?.customer_name) {
        setUserName(orderData.customer_name);
      }
    };

    fetchUserName();
  }, [user?.id]);

  // Initialize form with existing review data when editing
  const startEditing = useCallback(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
      setIsEditing(true);
    }
  }, [existingReview]);

  const cancelEditing = useCallback(() => {
    setRating(0);
    setComment("");
    setIsEditing(false);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    
    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          rating,
          comment: comment.trim(),
        });
        toast.success("Review updated successfully!");
        setIsEditing(false);
      } else {
        await submitReview.mutateAsync({
          productId,
          userId: user.id,
          rating,
          comment: comment.trim(),
          userName: userName || null,
        });
        toast.success("Thank you for your review!");
        setRating(0);
        setComment("");
      }
    } catch (error) {
      console.error("Review error:", error);
      if (error.code === "23505") {
        toast.error("You've already reviewed this product");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    }
  }, [rating, comment, isEditing, existingReview, productId, user?.id, submitReview, updateReview]);

  const handleDelete = useCallback(async () => {
    if (!existingReview) return;
    
    if (!confirm("Are you sure you want to delete your review?")) return;

    try {
      await deleteReview.mutateAsync({
        reviewId: existingReview.id,
        productId,
      });
      toast.success("Review deleted");
      setIsEditing(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete review");
    }
  }, [existingReview, productId, deleteReview]);

  const isLoading = checkingEligibility || loadingExisting;
  const isSubmitting = submitReview.isPending || updateReview.isPending || deleteReview.isPending;

  // Not logged in
  if (!user) {
    return (
      <Card className="p-6 bg-muted/50">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Want to leave a review?</p>
            <p className="text-sm text-muted-foreground">
              <button 
                onClick={() => navigate("/auth")}
                className="text-[hsl(var(--royal-gold))] hover:underline font-medium"
              >
                Sign in
              </button>
              {" "}to share your experience.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Loading eligibility
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Checking review eligibility...</span>
        </div>
      </Card>
    );
  }

  // User has already reviewed (show their review with edit option)
  if (existingReview && !isEditing) {
    return (
      <Card className="p-6 border-[hsl(var(--royal-gold))]/30 bg-[hsl(var(--royal-gold))]/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium">You've reviewed this product</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={startEditing}>
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
        <div className="mt-3 pl-7">
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= existingReview.rating
                    ? "fill-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))]"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">"{existingReview.comment}"</p>
        </div>
      </Card>
    );
  }

  // Not eligible to review
  // Don't show form if user can't review (no eligibility message on product page)
  if (!canReview && !isEditing) {
    return null;
  }

  // Show review form (new or editing)
  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Rating</label>
          <StarSelector value={rating} onChange={setRating} disabled={isSubmitting} />
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium mb-2">
            Your Review
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Submit buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="bg-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold-dark))] text-foreground"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Submitting..."}
              </>
            ) : (
              isEditing ? "Update Review" : "Submit Review"
            )}
          </Button>
          
          {isEditing && (
            <Button type="button" variant="ghost" onClick={cancelEditing} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
});

export default ReviewForm;
