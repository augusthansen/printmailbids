'use client';

import { useCallback, useRef } from 'react';

type EventType = 'view' | 'video_play' | 'watchlist_add' | 'bid_click' | 'offer_click' | 'share';

interface TrackEventParams {
  listingId: string;
  eventType: EventType;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

// Generate or retrieve session ID for anonymous tracking
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('pmb_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('pmb_session_id', sessionId);
  }
  return sessionId;
}

export function useAnalytics() {
  // Track which events have been sent to prevent duplicates
  const sentEvents = useRef<Set<string>>(new Set());

  const trackEvent = useCallback(async ({ listingId, eventType, userId, metadata }: TrackEventParams) => {
    // Create a unique key for this event to prevent duplicates
    const eventKey = `${listingId}-${eventType}-${userId || 'anon'}`;

    // For view events, only track once per session per listing
    if (eventType === 'view' && sentEvents.current.has(eventKey)) {
      return;
    }

    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          event_type: eventType,
          user_id: userId || null,
          session_id: getSessionId(),
          metadata: metadata || {},
        }),
      });

      if (response.ok) {
        sentEvents.current.add(eventKey);
      }
    } catch (error) {
      // Silently fail - analytics shouldn't break the user experience
      console.error('Analytics error:', error);
    }
  }, []);

  const trackView = useCallback((listingId: string, userId?: string | null) => {
    trackEvent({ listingId, eventType: 'view', userId });
  }, [trackEvent]);

  const trackVideoPlay = useCallback((listingId: string, userId?: string | null) => {
    trackEvent({ listingId, eventType: 'video_play', userId });
  }, [trackEvent]);

  const trackWatchlistAdd = useCallback((listingId: string, userId?: string | null) => {
    trackEvent({ listingId, eventType: 'watchlist_add', userId });
  }, [trackEvent]);

  const trackBidClick = useCallback((listingId: string, userId?: string | null) => {
    trackEvent({ listingId, eventType: 'bid_click', userId });
  }, [trackEvent]);

  const trackOfferClick = useCallback((listingId: string, userId?: string | null) => {
    trackEvent({ listingId, eventType: 'offer_click', userId });
  }, [trackEvent]);

  const trackShare = useCallback((listingId: string, userId?: string | null, platform?: string) => {
    trackEvent({ listingId, eventType: 'share', userId, metadata: { platform } });
  }, [trackEvent]);

  return {
    trackEvent,
    trackView,
    trackVideoPlay,
    trackWatchlistAdd,
    trackBidClick,
    trackOfferClick,
    trackShare,
  };
}
