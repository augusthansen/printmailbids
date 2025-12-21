'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User
} from 'lucide-react';
import Link from 'next/link';

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  created_at: string;
  listing: {
    title: string;
  } | null;
  buyer: {
    email: string;
    full_name: string | null;
  } | null;
  seller: {
    email: string;
    full_name: string | null;
  } | null;
  messages: {
    id: string;
    content: string;
    created_at: string;
  }[];
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender: {
    email: string;
    full_name: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [currentPage]);

  async function loadConversations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'messages',
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const { data, count } = await res.json();

      setConversations(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversationMessages(conversationId: string) {
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams({
        type: 'conversation_messages',
        conversationId,
      });

      const res = await fetch(`/api/admin/data?${params}`);
      const { data } = await res.json();

      setConversationMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }

  function viewConversation(conv: Conversation) {
    setSelectedConversation(conv);
    loadConversationMessages(conv.id);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400 mt-1">Monitor all conversations for moderation</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">{totalCount} conversations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversations List */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Conversations</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => viewConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-slate-700/50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.listing?.title || 'Unknown Listing'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {conv.buyer?.full_name || conv.buyer?.email || 'Unknown'} ↔ {conv.seller?.full_name || conv.seller?.email || 'Unknown'}
                      </p>
                      {conv.messages && conv.messages.length > 0 && (
                        <p className="text-xs text-slate-500 mt-2 truncate">
                          {conv.messages[conv.messages.length - 1]?.content}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-500">
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleDateString()
                          : new Date(conv.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {conv.messages?.length || 0} msgs
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Message Thread */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {selectedConversation ? 'Message Thread' : 'Select a Conversation'}
            </h2>
            {selectedConversation && (
              <Link
                href={`/listing/${selectedConversation.listing_id}`}
                target="_blank"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
                title="View listing"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>

          {!selectedConversation ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>Select a conversation to view messages</p>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <MessageSquare className="h-12 w-12 mb-4" />
              <p>No messages in this conversation</p>
            </div>
          ) : (
            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Conversation Info */}
              <div className="bg-slate-700/50 rounded-lg p-3 text-xs space-y-1">
                <p className="text-slate-300">
                  <strong>Listing:</strong> {selectedConversation.listing?.title}
                </p>
                <p className="text-slate-300">
                  <strong>Buyer:</strong> {selectedConversation.buyer?.full_name || selectedConversation.buyer?.email}
                </p>
                <p className="text-slate-300">
                  <strong>Seller:</strong> {selectedConversation.seller?.full_name || selectedConversation.seller?.email}
                </p>
              </div>

              {/* Messages */}
              {conversationMessages.map((msg) => {
                const isBuyer = msg.sender_id === selectedConversation.buyer_id;
                return (
                  <div key={msg.id} className={`flex ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      isBuyer ? 'bg-slate-700' : 'bg-blue-900/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-300">
                          {msg.sender?.full_name || msg.sender?.email || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {isBuyer ? '(Buyer)' : '(Seller)'}
                        </span>
                      </div>
                      <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
