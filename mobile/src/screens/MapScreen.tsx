import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Race, User } from '../../../shared/types';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import Button, { RaceButton } from '../components/common/Button';
import LoadingScreen, { InlineLoading } from '../components/common/LoadingScreen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MapMarker {
  id: string;
  type: 'race' | 'racer' | 'checkpoint';
  coordinate: { latitude: number; longitude: number };
  title: string;
  subtitle?: string;
  data: any;
}

interface MapControlsProps {
  onFilterChange: (filter: 'all' | 'races' | 'racers') => void;
  currentFilter: 'all' | 'races' | 'racers';
  onLocationPress: () => void;
  onRefreshPress: () => void;
  isLoading: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  onFilterChange,
  currentFilter,
  onLocationPress,
  onRefreshPress,
  isLoading,
}) => {
  return (
    <View style={styles.mapControls}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'all' && styles.activeFilter]}
          onPress={() => onFilterChange('all')}
        >
          <Text style={[styles.filterText, currentFilter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'races' && styles.activeFilter]}
          onPress={() => onFilterChange('races')}
        >
          <Text style={[styles.filterText, currentFilter === 'races' && styles.activeFilterText]}>
            🏁 Races
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, currentFilter === 'racers' && styles.activeFilter]}
          onPress={() => onFilterChange('racers')}
        >
          <Text style={[styles.filterText, currentFilter === 'racers' && styles.activeFilterText]}>
            🏎️ Racers
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={onLocationPress}>
          <Text style={styles.iconButtonText}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, isLoading && styles.loadingButton]}
          onPress={onRefreshPress}
          disabled={isLoading}
        >
          <Text style={styles.iconButtonText}>
            {isLoading ? '🔄' : '↻'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface RaceCardProps {
  race: Race;
  onJoinRace: (race: Race) => void;
  onViewDetails: (race: Race) => void;
  isJoining: boolean;
}

const RaceCard: React.FC<RaceCardProps> = ({ race, onJoinRace, onViewDetails, isJoining }) => {
  const { state } = useApp();
  const isMyRace = race.creatorId === state.user?.id;
  const isJoined = race.participants.some(p => p.userId === state.user?.id);

  return (
    <View style={styles.raceCard}>
      <View style={styles.raceCardHeader}>
        <View style={styles.raceInfo}>
          <Text style={styles.raceType}>
            {race.type === 'drag' ? '🏁' : 
             race.type === 'circuit' ? '🏎️' : 
             race.type === 'drift' ? '💨' : '⏱️'} {race.type.toUpperCase()}
          </Text>
          <Text style={styles.raceDistance}>{race.distance} mi</Text>
        </View>
        <Text style={[styles.statusBadge, { backgroundColor: 
          race.status === 'scheduled' ? colors.warning :
          race.status === 'active' ? colors.success :
          colors.textSecondary
        }]}>
          {race.status}
        </Text>
      </View>

      <Text style={styles.raceLocation}>📍 {race.location.address}</Text>
      <Text style={styles.raceTime}>
        🕐 {new Date(race.startTime).toLocaleTimeString()}
      </Text>
      <Text style={styles.raceParticipants}>
        👥 {race.participants.length}/{race.maxParticipants}
      </Text>

      <View style={styles.raceCardActions}>
        <Button
          title="Details"
          onPress={() => onViewDetails(race)}
          variant="ghost"
          size="small"
          style={styles.detailsButton}
        />
        {!isMyRace && !isJoined && race.status === 'scheduled' && (
          <RaceButton
            title={isJoining ? "Joining..." : "Join"}
            onPress={() => onJoinRace(race)}
            raceType="join"
            size="small"
            loading={isJoining}
            disabled={isJoining || race.participants.length >= race.maxParticipants}
          />
        )}
      </View>
    </View>
  );
};

interface MockMapViewProps {
  markers: MapMarker[];
  onMarkerPress: (marker: MapMarker) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const MockMapView: React.FC<MockMapViewProps> = ({ markers, onMarkerPress, userLocation }) => {
  return (
    <View style={styles.mapContainer}>
      <View style={styles.mapBackground}>
        {/* Grid lines to simulate map */}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: (i * screenHeight) / 10 }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineVertical, { left: (i * screenWidth) / 10 }]} />
        ))}

        {/* User location */}
        {userLocation && (
          <View style={[styles.userMarker, {
            left: screenWidth * 0.5 - 15,
            top: screenHeight * 0.5 - 15,
          }]}>
            <Text style={styles.userMarkerText}>📍</Text>
          </View>
        )}

        {/* Map markers */}
        {markers.map((marker, index) => (
          <TouchableOpacity
            key={marker.id}
            style={[styles.mapMarker, {
              left: (index % 3) * (screenWidth / 3) + 50,
              top: (Math.floor(index / 3)) * 100 + 150,
            }]}
            onPress={() => onMarkerPress(marker)}
          >
            <Text style={styles.markerIcon}>
              {marker.type === 'race' ? '🏁' : 
               marker.type === 'racer' ? '🏎️' : '🚩'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapOverlay}>
        <Text style={styles.mapTitle}>Live Racing Map</Text>
        <Text style={styles.mapSubtitle}>
          {userLocation ? 'Showing your location' : 'Location access disabled'}
        </Text>
      </View>
    </View>
  );
};

const MapScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [filter, setFilter] = useState<'all' | 'races' | 'racers'>('all');
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [joiningRaceId, setJoiningRaceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    // Simulate getting user location
    if (state.hasLocationPermission) {
      setUserLocation({ latitude: 40.7128, longitude: -74.0060 });
      loadMapData();
    } else {
      requestLocationPermission();
    }
  }, [state.hasLocationPermission]);

  const requestLocationPermission = () => {
    Alert.alert(
      'Location Access',
      'Enable location services to see nearby races and racers on the map.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enable', 
          onPress: () => {
            // In real app, this would request actual permissions
            actions.setLocationPermission(true);
            actions.showNotification('Location access enabled', 'success');
          }
        },
      ]
    );
  };

  const loadMapData = async () => {
    if (!userLocation && !state.hasLocationPermission) return;

    try {
      // Load nearby races
      await actions.loadNearbyRaces(40.7128, -74.0060);
      
      // In a real app, we'd also load nearby active racers
      // await actions.loadNearbyRacers(userLocation.latitude, userLocation.longitude);
    } catch (error) {
      actions.showNotification('Failed to load map data', 'error');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMapData();
    setIsRefreshing(false);
    actions.showNotification('Map data refreshed', 'success');
  };

  const handleLocationPress = () => {
    if (!state.hasLocationPermission) {
      requestLocationPermission();
    } else {
      // Center map on user location
      actions.showNotification('Centered on your location', 'info');
    }
  };

  const generateMarkers = (): MapMarker[] => {
    const markers: MapMarker[] = [];

    // Add race markers
    if (filter === 'all' || filter === 'races') {
      state.nearbyRaces.forEach(race => {
        markers.push({
          id: `race-${race.id}`,
          type: 'race',
          coordinate: { latitude: race.location.lat, longitude: race.location.lng },
          title: `${race.type} Race`,
          subtitle: `${race.distance}mi • ${race.participants.length}/${race.maxParticipants} racers`,
          data: race,
        });
      });
    }

    // Add mock racer markers
    if (filter === 'all' || filter === 'racers') {
      // In a real app, these would be actual nearby racers
      const mockRacers = [
        { id: '1', username: 'SpeedDemon', location: { lat: 40.7130, lng: -74.0058 } },
        { id: '2', username: 'NightRider', location: { lat: 40.7125, lng: -74.0065 } },
        { id: '3', username: 'TurboCharged', location: { lat: 40.7135, lng: -74.0055 } },
      ];

      mockRacers.forEach(racer => {
        markers.push({
          id: `racer-${racer.id}`,
          type: 'racer',
          coordinate: { latitude: racer.location.lat, longitude: racer.location.lng },
          title: racer.username,
          subtitle: 'Online now',
          data: racer,
        });
      });
    }

    return markers;
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
  };

  const handleJoinRace = async (race: Race) => {
    if (!state.selectedVehicle) {
      Alert.alert('No Vehicle Selected', 'Please select a vehicle in your garage first.');
      return;
    }

    setJoiningRaceId(race.id);
    const success = await actions.joinRace(race.id);
    
    if (success) {
      actions.showNotification('Successfully joined race!', 'success');
      setSelectedMarker(null);
    } else {
      actions.showNotification('Failed to join race', 'error');
    }
    
    setJoiningRaceId(null);
  };

  const handleViewRaceDetails = (race: Race) => {
    Alert.alert(
      `${race.type.toUpperCase()} Race`,
      `Distance: ${race.distance} miles\nStart Time: ${new Date(race.startTime).toLocaleString()}\nParticipants: ${race.participants.length}/${race.maxParticipants}\nLocation: ${race.location.address}`,
      [
        { text: 'Close', style: 'cancel' },
        race.status === 'scheduled' && race.creatorId !== state.user?.id && 
        !race.participants.some(p => p.userId === state.user?.id) &&
        race.participants.length < race.maxParticipants
          ? { text: 'Join Race', onPress: () => handleJoinRace(race) }
          : undefined,
      ].filter(Boolean) as any[]
    );
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading map data..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to access the racing map</Text>
        </View>
      </SafeAreaView>
    );
  }

  const markers = generateMarkers();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MockMapView
        markers={markers}
        onMarkerPress={handleMarkerPress}
        userLocation={userLocation}
      />

      <MapControls
        onFilterChange={setFilter}
        currentFilter={filter}
        onLocationPress={handleLocationPress}
        onRefreshPress={handleRefresh}
        isLoading={isRefreshing}
      />

      {/* Selected marker info */}
      {selectedMarker && (
        <View style={styles.markerInfo}>
          <View style={styles.markerInfoHeader}>
            <Text style={styles.markerTitle}>{selectedMarker.title}</Text>
            <TouchableOpacity
              style={styles.closeMarkerButton}
              onPress={() => setSelectedMarker(null)}
            >
              <Text style={styles.closeMarkerText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedMarker.subtitle && (
            <Text style={styles.markerSubtitle}>{selectedMarker.subtitle}</Text>
          )}

          {selectedMarker.type === 'race' && (
            <RaceCard
              race={selectedMarker.data}
              onJoinRace={handleJoinRace}
              onViewDetails={handleViewRaceDetails}
              isJoining={joiningRaceId === selectedMarker.data.id}
            />
          )}

          {selectedMarker.type === 'racer' && (
            <View style={styles.racerInfo}>
              <Text style={styles.racerStatus}>🟢 Online</Text>
              <Button
                title="Send Friend Request"
                onPress={() => {
                  actions.showNotification('Friend request sent!', 'success');
                  setSelectedMarker(null);
                }}
                variant="secondary"
                size="small"
              />
            </View>
          )}
        </View>
      )}

      {!state.hasLocationPermission && (
        <View style={styles.locationWarning}>
          <Text style={styles.warningText}>📍 Location access disabled</Text>
          <Text style={styles.warningSubtext}>
            Enable location to see nearby races and racers
          </Text>
          <Button
            title="Enable Location"
            onPress={requestLocationPermission}
            size="small"
            style={styles.enableLocationButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  mapContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,

  mapBackground: {
    flex: 1,
    backgroundColor: colors.surface + '40',
    position: 'relative',
  } as ViewStyle,

  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.textSecondary + '20',
  } as ViewStyle,

  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.textSecondary + '20',
  } as ViewStyle,

  mapOverlay: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background + 'E6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  } as ViewStyle,

  mapTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,

  mapSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  } as TextStyle,

  userMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: colors.background,
    ...shadows.md,
  } as ViewStyle,

  userMarkerText: {
    fontSize: 16,
  } as TextStyle,

  mapMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    ...shadows.md,
  } as ViewStyle,

  markerIcon: {
    fontSize: 20,
  } as TextStyle,

  mapControls: {
    position: 'absolute',
    top: 160,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background + 'E6',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    ...shadows.sm,
  } as ViewStyle,

  filterButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  } as ViewStyle,

  activeFilter: {
    backgroundColor: colors.primary,
  } as ViewStyle,

  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,

  activeFilterText: {
    color: colors.background,
    fontWeight: '600',
  } as TextStyle,

  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  } as ViewStyle,

  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.background + 'E6',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  } as ViewStyle,

  loadingButton: {
    opacity: 0.6,
  } as ViewStyle,

  iconButtonText: {
    fontSize: 18,
  } as TextStyle,

  markerInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
    maxHeight: 300,
  } as ViewStyle,

  markerInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  } as ViewStyle,

  markerTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  } as TextStyle,

  closeMarkerButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  closeMarkerText: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,

  markerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,

  raceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  } as ViewStyle,

  raceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  } as ViewStyle,

  raceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,

  raceType: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,

  raceDistance: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,

  statusBadge: {
    ...typography.caption,
    color: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
  } as TextStyle,

  raceLocation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } as TextStyle,

  raceTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } as TextStyle,

  raceParticipants: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,

  raceCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,

  detailsButton: {
    flex: 1,
  } as ViewStyle,

  racerInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,

  racerStatus: {
    ...typography.body,
    color: colors.success,
    fontWeight: '500',
  } as TextStyle,

  locationWarning: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  } as ViewStyle,

  warningText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,

  warningSubtext: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  } as TextStyle,

  enableLocationButton: {
    minWidth: 120,
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
});

export default MapScreen;