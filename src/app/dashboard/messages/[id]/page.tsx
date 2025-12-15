'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Send, User, ExternalLink, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  listing_id: string | null;
  invoice_id: string | null;
  participant_1_id: string;
  participant_2_id: string;
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
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const conversationId = params.id as string;

  // Load conversation and messages
  useEffect(() => {
    async function loadConversation() {
      if (!user?.id || !conversationId) return;

      // Get conversation details
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings (
            id,
            title
          )
        `)
        .eq('id', conversationId)
        .single();

      if (convoError || !convo) {
        console.error('Error loading conversation:', convoError);
        router.push('/dashboard/messages');
        return;
      }

      // Make sure user is a participant
      if (convo.participant_1_id !== user.id && convo.participant_2_id !== user.id) {
        router.push('/dashboard/messages');
        return;
      }

      // Get other user details
      const otherId = convo.participant_1_id === user.id
        ? convo.participant_2_id
        : convo.participant_1_id;

      const { data: otherUser } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, avatar_url')
        .eq('id', otherId)
        .single();

      setConversation({
        ...convo,
        other_user: otherUser || { id: otherId, full_name: null, company_name: null, avatar_url: null },
      });

      // Get messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    }

    loadConversation();
  }, [user?.id, conversationId, supabase, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if not from current user
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from('messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, supabase]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.id || !conversationId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(content);
    } else {
      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Notify the other user
      if (conversation?.other_user.id) {
        await supabase.from('notifications').insert({
          user_id: conversation.other_user.id,
          type: 'buyer_message',
          title: 'New message',
          body: content.length > 50 ? content.substring(0, 50) + '...' : content,
          listing_id: conversation.listing_id,
        });
      }
    }

    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-xl border border-gray-200 p-4 flex items-center gap-4">
        <Link
          href="/dashboard/messages"
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Other user info */}
        <div className="flex items-center gap-3 flex-1">
          {conversation.other_user.avatar_url ? (
            <img
              src={conversation.other_user.avatar_url}
              alt={conversation.other_user.full_name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {conversation.other_user.company_name || conversation.other_user.full_name || 'Unknown User'}
            </p>
            {conversation.listing && (
              <Link
                href={`/listing/${conversation.listing.id}`}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Re: {conversation.listing.title}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 bg-gray-50 border-x border-gray-200 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isMe = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={sendMessage}
        className="bg-white rounded-b-xl border border-gray-200 border-t-0 p-4"
      >
        <div className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
