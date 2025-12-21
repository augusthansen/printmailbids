'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Search, User } from 'lucide-react';

interface Conversation {
  id: string;
  listing_id: string | null;
  invoice_id: string | null;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string | null;
  created_at: string;
  other_user: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
  };
  listing?: {
    id: string;
    title: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    is_read: boolean;
    created_at: string;
  };
  unread_count: number;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadConversations() {
      if (authLoading) return;
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Get all conversations where user is a participant
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings (
            id,
            title
          )
        `)
        .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error || !convos) {
        console.error('Error loading conversations:', error);
        setLoading(false);
        return;
      }

      // Get other user details and last message for each conversation
      const conversationsWithDetails = await Promise.all(
        convos.map(async (convo: { participant_1_id: string; participant_2_id: string; listing_id: string | null; id: string; listing?: { id: string; title: string } | null }) => {
          const otherId = convo.participant_1_id === user.id
            ? convo.participant_2_id
            : convo.participant_1_id;

          // Get other user profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, full_name, company_name, avatar_url')
            .eq('id', otherId)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, sender_id, is_read, created_at')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...convo,
            other_user: otherUser || { id: otherId, full_name: null, company_name: null, avatar_url: null },
            last_message: lastMsg || undefined,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
      setLoading(false);
    }

    loadConversations();
  }, [user?.id, authLoading, supabase]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(convo => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      convo.other_user.full_name?.toLowerCase().includes(query) ||
      convo.other_user.company_name?.toLowerCase().includes(query) ||
      convo.listing?.title.toLowerCase().includes(query)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up!'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500 mb-6">
            When you contact a seller or receive a message, it will appear here
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredConversations.map((convo, index) => (
            <Link
              key={convo.id}
              href={`/dashboard/messages/${convo.id}`}
              className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                index !== 0 ? 'border-t border-gray-100' : ''
              } ${convo.unread_count > 0 ? 'bg-blue-50/50' : ''}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {convo.other_user.avatar_url ? (
                  <img
                    src={convo.other_user.avatar_url}
                    alt={convo.other_user.full_name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
                {convo.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {convo.unread_count}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`font-medium ${convo.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                      {convo.other_user.company_name || convo.other_user.full_name || 'Unknown User'}
                    </p>
                    {convo.listing && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        Re: {convo.listing.title}
                      </p>
                    )}
                  </div>
                  {convo.last_message && (
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(convo.last_message.created_at)}
                    </span>
                  )}
                </div>

                {convo.last_message && (
                  <p className={`text-sm mt-1 line-clamp-1 ${
                    convo.unread_count > 0 ? 'text-gray-700' : 'text-gray-500'
                  }`}>
                    {convo.last_message.sender_id === user?.id ? 'You: ' : ''}
                    {convo.last_message.content}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
