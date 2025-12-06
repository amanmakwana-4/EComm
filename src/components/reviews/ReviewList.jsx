import { memo, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useProductReviews, useReviewStats } from "@/hooks/useReviews";
import { format } from "date-fns";

/**
 * Render star icons based on rating
 */
const StarRating = memo(function StarRating({ rating, size = "w-4 h-4" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? "fill-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))]"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
});

/**
 * Get initials from name
 */
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

/**
 * Single review card
 */
const ReviewCard = memo(function ReviewCard({ review }) {
  const userName = review.user_name || "Anonymous";
  const initial = getInitials(review.user_name);
  const reviewDate = new Date(review.created_at);
  const formattedDate = format(reviewDate, "MMM d, yyyy");
  const formattedTime = format(reviewDate, "h:mm a");

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar with initial */}
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--royal-gold))] flex items-center justify-center text-white font-semibold shrink-0">
          {initial}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Name and rating row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-sm">{userName}</span>
            <StarRating rating={review.rating} />
          </div>
          
          {/* Date and time */}
          <p className="text-xs text-muted-foreground mb-2">
            {formattedDate} at {formattedTime}
          </p>
          
          {/* Comment */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            "{review.comment}"
          </p>
        </div>
      </div>
    </Card>
  );
});

/**
 * Review list with stats header and pagination
 */
const ReviewList = memo(function ReviewList({ productId }) {
  const { data: reviews, isLoading: reviewsLoading } = useProductReviews(productId);
  const { data: stats, isLoading: statsLoading } = useReviewStats(productId);
  const [visibleCount, setVisibleCount] = useState(10);

  const isLoading = reviewsLoading || statsLoading;

  // Calculate average rating display
  const averageRating = useMemo(() => {
    if (!stats?.average_rating) return 0;
    return Math.round(stats.average_rating);
  }, [stats?.average_rating]);

  // Get visible reviews based on current count
  const visibleReviews = useMemo(() => {
    return reviews?.slice(0, visibleCount) || [];
  }, [reviews, visibleCount]);

  const hasMore = reviews && reviews.length > visibleCount;

  const loadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} size="w-5 h-5" />
          <span className="text-lg font-semibold">
            {stats?.average_rating?.toFixed(1) || "0.0"}
          </span>
        </div>
        <span className="text-muted-foreground">
          ({stats?.review_count || 0} {stats?.review_count === 1 ? "review" : "reviews"})
        </span>
      </div>

      {/* Reviews list */}
      {reviews && reviews.length > 0 ? (
        <>
          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          
          {/* Load More button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                onClick={loadMore}
                variant="outline"
                className="border-[hsl(var(--royal-gold))] text-[hsl(var(--royal-gold))] hover:bg-[hsl(var(--royal-gold))] hover:text-white"
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        </Card>
      )}
    </div>
  );
});

export { ReviewList, StarRating, ReviewCard };
export default ReviewList;
