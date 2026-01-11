/**
 * API for sending messages
 *
 * This endpoint creates a message and sends push notifications
 * to the recipient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import notifications from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    let user = null;
    const adminClient = createAdminClient();

    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error } = await adminClient.auth.getUser(token);
      if (!error && tokenUser) {
        user = tokenUser;
      }
    }

    if (!user) {
      const supabase = await createClient();
      const { data: { user: cookieUser } } = await supabase.auth.getUser();
      if (cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, content } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: 'Conversation ID and content required' }, { status: 400 });
    }

    // Get the conversation to verify user is a participant
    const { data: conversation, error: convError } = await adminClient
      .from('conversations')
      .select('id, buyer_id, seller_id, listing_id, listing:listings(id, title)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify the user is a participant
    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to send messages in this conversation' }, { status: 403 });
    }

    // Determine the recipient
    const recipientId = conversation.buyer_id === user.id
      ? conversation.seller_id
      : conversation.buyer_id;

    // Get sender's name for the notification
    const { data: senderProfile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.full_name || 'Someone';

    // Create the message
    const { data: message, error: msgError } = await adminClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgError) {
      console.error('Failed to create message:', msgError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update conversation last_message_at
    await adminClient
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Send push notification to recipient
    await notifications.newMessage(
      recipientId,
      senderName,
      conversationId,
      conversation.listing_id
    );

    return NextResponse.json({
      success: true,
      message: message,
    });

  } catch (error) {
    console.error('Message send API error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
