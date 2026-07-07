import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { fetchWithAuth } from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { MessageCircle, Search } from 'lucide-react-native';

export default function AdminChatListScreen() {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const loadSummaries = async () => {
    try {
      const data = await fetchWithAuth('/chat/summary');
      setConversations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMsg = () => loadSummaries();
      socket.on('new_chat_message', handleNewMsg);
      socket.on('message', handleNewMsg);
      return () => {
        socket.off('new_chat_message', handleNewMsg);
        socket.off('message', handleNewMsg);
      };
    }
  }, [socket]);

  const renderItem = ({ item }: any) => {
    const isUnread = item.unreadCount > 0;
    
    return (
      <TouchableOpacity 
        style={[s.card, isUnread && s.cardUnread]}
        onPress={() => navigation.navigate('ChatScreen', { targetUserId: item._id, title: item.userInfo?.name || 'User' })}
      >
        <View style={s.avatarContainer}>
          {item.userInfo?.profilePic ? (
            <Image source={{ uri: item.userInfo.profilePic }} style={s.avatar} />
          ) : (
            <View style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>
                {(item.userInfo?.name || 'U').substring(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          {item.userInfo?.isOnline && <View style={s.onlineBadge} />}
        </View>

        <View style={s.content}>
          <View style={s.headerRow}>
            <Text style={[s.name, isUnread && s.nameUnread]} numberOfLines={1}>
              {item.userInfo?.name || 'Unknown User'}
            </Text>
            <Text style={s.time}>
              {new Date(item.lastMessage?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <View style={s.footerRow}>
            <Text style={[s.lastMessage, isUnread && s.lastMessageUnread]} numberOfLines={1}>
              {item.lastMessage?.content || 'Sent an attachment'}
            </Text>
            {isUnread && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Support Inbox</Text>
          <Text style={s.headerSub}>{conversations.length} Active Conversations</Text>
        </View>
        <TouchableOpacity style={s.searchBtn}>
          <Search color={Colors.fgPrimary} size={20} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={(i, index) => i._id?.toString() || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <MessageCircle size={48} color={Colors.fgDim} />
            <Text style={s.emptyText}>No conversations yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.fgPrimary },
  headerSub: { fontSize: 13, color: Colors.fgMuted, marginTop: 4 },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    backgroundColor: Colors.bgSurface,
    borderColor: Colors.primaryLight + '40',
  },
  avatarContainer: { marginRight: 16, position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.bgMuted },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.primaryLight },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.bgCard
  },
  content: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.fgPrimary, flex: 1, marginRight: 8 },
  nameUnread: { fontWeight: '800' },
  time: { fontSize: 12, color: Colors.fgMuted },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 14, color: Colors.fgMuted, flex: 1, marginRight: 8 },
  lastMessageUnread: { color: Colors.fgPrimary, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.danger,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: Colors.fgMuted, fontSize: 16, fontWeight: '600' }
});
