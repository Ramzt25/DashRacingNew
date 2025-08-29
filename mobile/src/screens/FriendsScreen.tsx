import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { User } from '../../../shared/types';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import Button from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';

interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

interface Friend extends User {
  friendship: Friendship;
  isOnline: boolean;
  lastSeen?: Date;
  currentActivity?: {
    type: 'racing' | 'garage' | 'meetup' | 'idle';
    details?: string;
  };
}

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSendRequest: (username: string) => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ visible, onClose, onSendRequest }) => {
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSendRequest = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setIsSearching(true);
    try {
      await onSendRequest(username.trim());
      setUsername('');
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Friend</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalDescription}>
            Enter the username of the person you'd like to add as a friend.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.modalButton}
            />
            <Button
              title={isSearching ? "Searching..." : "Send Request"}
              onPress={handleSendRequest}
              loading={isSearching}
              disabled={isSearching || !username.trim()}
              style={styles.modalButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface FriendCardProps {
  friend: Friend;
  onViewProfile: (friend: Friend) => void;
  onRemoveFriend: (friend: Friend) => void;
  onBlockUser: (friend: Friend) => void;
  onInviteToRace: (friend: Friend) => void;
  currentUserId?: string;
}

const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onViewProfile,
  onRemoveFriend,
  onBlockUser,
  onInviteToRace,
}) => {
  const getActivityText = () => {
    if (!friend.isOnline) {
      return friend.lastSeen 
        ? `Last seen ${friend.lastSeen.toLocaleDateString()}`
        : 'Offline';
    }

    if (!friend.currentActivity) return 'Online';

    switch (friend.currentActivity.type) {
      case 'racing':
        return `🏁 Racing ${friend.currentActivity.details || ''}`;
      case 'garage':
        return '🔧 In garage';
      case 'meetup':
        return `📅 At meetup ${friend.currentActivity.details || ''}`;
      default:
        return '🟢 Online';
    }
  };

  const getActivityColor = () => {
    if (!friend.isOnline) return colors.textSecondary;
    
    switch (friend.currentActivity?.type) {
      case 'racing':
        return colors.primary;
      case 'garage':
        return colors.warning;
      case 'meetup':
        return colors.accent;
      default:
        return colors.success;
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      friend.username,
      'Choose an action',
      [
        { text: 'View Profile', onPress: () => onViewProfile(friend) },
        { text: 'Invite to Race', onPress: () => onInviteToRace(friend) },
        { text: 'Remove Friend', style: 'destructive', onPress: () => onRemoveFriend(friend) },
        { text: 'Block User', style: 'destructive', onPress: () => onBlockUser(friend) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => onViewProfile(friend)}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {friend.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          {friend.isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: getActivityColor() }]} />
          )}
        </View>

        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <Text style={[styles.friendActivity, { color: getActivityColor() }]}>
            {getActivityText()}
          </Text>
          {friend.stats && (
            <Text style={styles.friendStats}>
              🏆 {friend.stats.racesWon} wins • 🏁 {friend.stats.totalRaces} races
            </Text>
          )}
        </View>
      </View>

      <View style={styles.friendActions}>
        {friend.isOnline && friend.currentActivity?.type !== 'racing' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onInviteToRace(friend)}
          >
            <Text style={styles.actionButtonText}>🏁</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface FriendRequestCardProps {
  request: Friend;
  type: 'incoming' | 'outgoing';
  onAccept?: (request: Friend) => void;
  onDecline?: (request: Friend) => void;
  onCancel?: (request: Friend) => void;
}

const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}) => {
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>
            {request.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.requestDetails}>
          <Text style={styles.requestName}>{request.username}</Text>
          <Text style={styles.requestDate}>
            {type === 'incoming' ? 'Wants to be friends' : 'Request sent'}
          </Text>
          {request.stats && (
            <Text style={styles.requestStats}>
              🏆 {request.stats.racesWon} wins • 🏁 {request.stats.totalRaces} races
            </Text>
          )}
        </View>
      </View>

      <View style={styles.requestActions}>
        {type === 'incoming' ? (
          <>
            <Button
              title="Accept"
              onPress={() => onAccept?.(request)}
              size="small"
              style={styles.acceptButton}
            />
            <Button
              title="Decline"
              onPress={() => onDecline?.(request)}
              variant="secondary"
              size="small"
              style={styles.declineButton}
            />
          </>
        ) : (
          <Button
            title="Cancel"
            onPress={() => onCancel?.(request)}
            variant="secondary"
            size="small"
          />
        )}
      </View>
    </View>
  );
};

const FriendsScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [showAddModal, setShowAddModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = () => {
    // Mock friends data - in real app, this would come from API
    const mockFriends: Friend[] = [
      {
        id: 'friend1',
        username: 'SpeedDemon',
        email: 'speed@example.com',
        stats: {
          totalRaces: 45,
          racesWon: 23,
          totalDistance: 1250.5,
          bestLapTime: 58.23,
          averageSpeed: 85.2,
          preferredTracks: ['drag', 'circuit'],
        },
        preferences: {
          units: 'imperial',
          notifications: true,
          location: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        friendship: {
          id: 'friendship1',
          userId: state.user?.id || '',
          friendId: 'friend1',
          status: 'accepted',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isOnline: true,
        currentActivity: {
          type: 'racing',
          details: 'Drag Race',
        },
      },
      {
        id: 'friend2',
        username: 'NightRider',
        email: 'night@example.com',
        stats: {
          totalRaces: 32,
          racesWon: 18,
          totalDistance: 980.3,
          bestLapTime: 62.15,
          averageSpeed: 78.9,
          preferredTracks: ['circuit', 'drift'],
        },
        preferences: {
          units: 'imperial',
          notifications: true,
          location: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        friendship: {
          id: 'friendship2',
          userId: state.user?.id || '',
          friendId: 'friend2',
          status: 'accepted',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isOnline: true,
        currentActivity: {
          type: 'garage',
        },
      },
      {
        id: 'friend3',
        username: 'TurboCharged',
        email: 'turbo@example.com',
        stats: {
          totalRaces: 67,
          racesWon: 41,
          totalDistance: 1850.7,
          bestLapTime: 55.88,
          averageSpeed: 92.1,
          preferredTracks: ['drag', 'time-trial'],
        },
        preferences: {
          units: 'metric',
          notifications: false,
          location: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        friendship: {
          id: 'friendship3',
          userId: state.user?.id || '',
          friendId: 'friend3',
          status: 'accepted',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ];

    const mockIncomingRequests: Friend[] = [
      {
        id: 'request1',
        username: 'RaceFan99',
        email: 'race@example.com',
        stats: {
          totalRaces: 15,
          racesWon: 7,
          totalDistance: 420.1,
          bestLapTime: 65.44,
          averageSpeed: 72.3,
          preferredTracks: ['circuit'],
        },
        preferences: {
          units: 'imperial',
          notifications: true,
          location: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        friendship: {
          id: 'request1',
          userId: 'request1',
          friendId: state.user?.id || '',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        isOnline: true,
      },
    ];

    setFriends(mockFriends);
    setIncomingRequests(mockIncomingRequests);
    setOutgoingRequests([]);
  };

  const handleSendFriendRequest = async (username: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, this would send actual request
      actions.showNotification(`Friend request sent to ${username}!`, 'success');
    } catch (error) {
      actions.showNotification('Failed to send friend request', 'error');
      throw error;
    }
  };

  const handleAcceptRequest = async (request: Friend) => {
    try {
      // Move from requests to friends
      setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
      setFriends(prev => [...prev, { ...request, friendship: { ...request.friendship, status: 'accepted' } }]);
      
      actions.showNotification(`You are now friends with ${request.username}!`, 'success');
    } catch (error) {
      actions.showNotification('Failed to accept friend request', 'error');
    }
  };

  const handleDeclineRequest = async (request: Friend) => {
    try {
      setIncomingRequests(prev => prev.filter(r => r.id !== request.id));
      actions.showNotification('Friend request declined', 'info');
    } catch (error) {
      actions.showNotification('Failed to decline friend request', 'error');
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              actions.showNotification(`Removed ${friend.username} from friends`, 'info');
            } catch (error) {
              actions.showNotification('Failed to remove friend', 'error');
            }
          }
        }
      ]
    );
  };

  const handleBlockUser = async (friend: Friend) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friend.username}? This will remove them from your friends and prevent them from contacting you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setFriends(prev => prev.filter(f => f.id !== friend.id));
              actions.showNotification(`Blocked ${friend.username}`, 'info');
            } catch (error) {
              actions.showNotification('Failed to block user', 'error');
            }
          }
        }
      ]
    );
  };

  const handleInviteToRace = async (friend: Friend) => {
    Alert.alert(
      'Invite to Race',
      `Invite ${friend.username} to a race?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Invite',
          onPress: () => {
            actions.showNotification(`Race invite sent to ${friend.username}!`, 'success');
          }
        }
      ]
    );
  };

  const handleViewProfile = (friend: Friend) => {
    const winRate = friend.stats ? ((friend.stats.racesWon / friend.stats.totalRaces) * 100).toFixed(1) : '0';
    
    Alert.alert(
      friend.username,
      `🏆 Races Won: ${friend.stats?.racesWon || 0}\n🏁 Total Races: ${friend.stats?.totalRaces || 0}\n📊 Win Rate: ${winRate}%\n🚗 Total Distance: ${friend.stats?.totalDistance || 0} miles\n⚡ Best Lap: ${friend.stats?.bestLapTime || 0}s\n📈 Avg Speed: ${friend.stats?.averageSpeed || 0} mph`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Invite to Race',
          onPress: () => handleInviteToRace(friend)
        }
      ]
    );
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading friends..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to access friends</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Friends</Text>
        <Button
          title="Add Friend"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({incomingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {activeTab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyTitle}>No Friends Yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add friends to see their racing activity and invite them to races!
                  </Text>
                  <Button
                    title="Add Your First Friend"
                    onPress={() => setShowAddModal(true)}
                    style={styles.addFriendButton}
                  />
                </View>
              ) : (
                friends.map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onViewProfile={handleViewProfile}
                    onRemoveFriend={handleRemoveFriend}
                    onBlockUser={handleBlockUser}
                    onInviteToRace={handleInviteToRace}
                    currentUserId={state.user?.id}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'requests' && (
            <>
              {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📨</Text>
                  <Text style={styles.emptyTitle}>No Friend Requests</Text>
                  <Text style={styles.emptySubtext}>
                    Friend requests will appear here when received.
                  </Text>
                </View>
              ) : (
                <>
                  {incomingRequests.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Incoming Requests</Text>
                      {incomingRequests.map(request => (
                        <FriendRequestCard
                          key={request.id}
                          request={request}
                          type="incoming"
                          onAccept={handleAcceptRequest}
                          onDecline={handleDeclineRequest}
                        />
                      ))}
                    </>
                  )}

                  {outgoingRequests.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Sent Requests</Text>
                      {outgoingRequests.map(request => (
                        <FriendRequestCard
                          key={request.id}
                          request={request}
                          type="outgoing"
                          onCancel={(req) => setOutgoingRequests(prev => prev.filter(r => r.id !== req.id))}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <AddFriendModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSendRequest={handleSendFriendRequest}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  } as TextStyle,
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  activeTab: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,
  
  activeTabText: {
    color: colors.background,
    fontWeight: '600',
  } as TextStyle,
  
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  } as ViewStyle,
  
  friendCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  } as ViewStyle,
  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  avatarText: {
    ...typography.h4,
    color: colors.background,
    fontWeight: '600',
  } as TextStyle,
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.background,
  } as ViewStyle,
  
  friendDetails: {
    flex: 1,
  } as ViewStyle,
  
  friendName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  friendActivity: {
    ...typography.body,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  friendStats: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,
  
  friendActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  } as ViewStyle,
  
  actionButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary + '20',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  actionButtonText: {
    fontSize: 16,
  } as TextStyle,
  
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  } as ViewStyle,
  
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,
  
  requestDetails: {
    flex: 1,
    marginLeft: spacing.md,
  } as ViewStyle,
  
  requestName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  requestDate: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  requestStats: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,
  
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  
  acceptButton: {
    flex: 1,
  } as ViewStyle,
  
  declineButton: {
    flex: 1,
  } as ViewStyle,
  
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  } as TextStyle,
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  } as ViewStyle,
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  } as TextStyle,
  
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,
  
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  } as TextStyle,
  
  addFriendButton: {
    minWidth: 200,
  } as ViewStyle,
  
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  
  promptText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  closeButtonText: {
    ...typography.h4,
    color: colors.textSecondary,
  } as TextStyle,
  
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  } as ViewStyle,
  
  modalDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  } as TextStyle,
  
  inputGroup: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  
  inputLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  textInput: {
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  } as ViewStyle,
  
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  
  modalButton: {
    flex: 1,
  } as ViewStyle,
});

export default FriendsScreen;