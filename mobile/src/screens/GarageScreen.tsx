import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Vehicle } from '../../../shared/types';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import LoadingScreen from '../components/common/LoadingScreen';
import Button from '../components/common/Button';

const GarageScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

  useEffect(() => {
    // Load user vehicles
    if (state.isAuthenticated && state.user) {
      actions.loadVehicles();
    }
  }, [state.isAuthenticated, state.user]);

  useEffect(() => {
    // Update selected index when vehicles change
    if (state.vehicles.length > 0 && state.selectedVehicle) {
      const index = state.vehicles.findIndex((v: Vehicle) => v.id === state.selectedVehicle?.id);
      if (index >= 0) {
        setSelectedVehicleIndex(index);
      }
    }
  }, [state.vehicles, state.selectedVehicle]);

  const handleVehicleSelect = (vehicle: Vehicle, index: number) => {
    setSelectedVehicleIndex(index);
    actions.selectVehicle(vehicle.id);
  };

  const handleAddVehicle = () => {
    // Navigate to add vehicle screen or show modal
    actions.showNotification('Add Vehicle feature coming soon!', 'info');
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading your garage..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to view your garage</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏎️ My Garage</Text>
          <Button
            title="Add Vehicle"
            onPress={handleAddVehicle}
            variant="primary"
            size="small"
          />
        </View>

        {state.vehicles.length === 0 ? (
          // Empty garage state
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first vehicle to start racing
            </Text>
            <Button
              title="Add Your First Car"
              onPress={handleAddVehicle}
              variant="primary"
              size="large"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <>
            {/* Vehicle Carousel */}
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / 
                    (event.nativeEvent.layoutMeasurement.width - spacing.lg * 2)
                  );
                  if (newIndex >= 0 && newIndex < state.vehicles.length) {
                    handleVehicleSelect(state.vehicles[newIndex], newIndex);
                  }
                }}
              >
                {state.vehicles.map((vehicle: Vehicle, index: number) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      index === selectedVehicleIndex && styles.selectedVehicleCard
                    ]}
                    onPress={() => handleVehicleSelect(vehicle, index)}
                  >
                    {vehicle.imageUrl ? (
                      <Image source={{ uri: vehicle.imageUrl }} style={styles.vehicleImage} />
                    ) : (
                      <View style={styles.vehiclePlaceholder}>
                        <Text style={styles.vehiclePlaceholderText}>🚗</Text>
                      </View>
                    )}
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>
                        {vehicle.year} {vehicle.make}
                      </Text>
                      <Text style={styles.vehicleModel}>{vehicle.model}</Text>
                    </View>
                    {vehicle.isSelected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>SELECTED</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Vehicle Details */}
            {state.selectedVehicle && (
              <View style={styles.detailsContainer}>
                <Text style={styles.sectionTitle}>Vehicle Details</Text>
                
                {/* Basic Info */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Make</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.make}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Model</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.model}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Year</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.year}</Text>
                  </View>
                </View>

                {/* Performance Stats */}
                <Text style={styles.sectionTitle}>Performance</Text>
                <View style={styles.specsGrid}>
                  <View style={styles.specCard}>
                    <Text style={styles.specValue}>{state.selectedVehicle.specs.horsepower}</Text>
                    <Text style={styles.specLabel}>Horsepower</Text>
                  </View>
                  <View style={styles.specCard}>
                    <Text style={styles.specValue}>{state.selectedVehicle.specs.torque}</Text>
                    <Text style={styles.specLabel}>Torque (lb-ft)</Text>
                  </View>
                  <View style={styles.specCard}>
                    <Text style={styles.specValue}>{state.selectedVehicle.specs.acceleration}</Text>
                    <Text style={styles.specLabel}>0-60 mph (s)</Text>
                  </View>
                  <View style={styles.specCard}>
                    <Text style={styles.specValue}>{state.selectedVehicle.specs.topSpeed}</Text>
                    <Text style={styles.specLabel}>Top Speed (mph)</Text>
                  </View>
                </View>

                {/* Technical Specs */}
                <Text style={styles.sectionTitle}>Specifications</Text>
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Transmission</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.specs.transmission}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Drivetrain</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.specs.drivetrain}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{state.selectedVehicle.specs.weight} lbs</Text>
                  </View>
                  {state.selectedVehicle.specs.fuelType && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fuel Type</Text>
                      <Text style={styles.infoValue}>{state.selectedVehicle.specs.fuelType}</Text>
                    </View>
                  )}
                  {state.selectedVehicle.specs.displacement && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Displacement</Text>
                      <Text style={styles.infoValue}>{state.selectedVehicle.specs.displacement}L</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Button
                    title="Modify Vehicle"
                    onPress={() => actions.showNotification('Modification feature coming soon!', 'info')}
                    variant="secondary"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Racing History"
                    onPress={() => actions.showNotification('Racing history feature coming soon!', 'info')}
                    variant="ghost"
                    style={styles.actionButton}
                  />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,

  title: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: 'bold',
  } as TextStyle,

  // Auth prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,

  promptText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  } as ViewStyle,

  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  } as TextStyle,

  emptyTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  } as TextStyle,

  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  } as TextStyle,

  emptyButton: {
    marginTop: spacing.lg,
  } as ViewStyle,

  // Carousel styles
  carouselContainer: {
    marginBottom: spacing.lg,
  } as ViewStyle,

  vehicleCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    width: 280,
    ...shadows.md,
  } as ViewStyle,

  selectedVehicleCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...shadows.racingGlow,
  } as ViewStyle,

  vehicleImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  } as ImageStyle,

  vehiclePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  vehiclePlaceholderText: {
    fontSize: 48,
  } as TextStyle,

  vehicleInfo: {
    padding: spacing.md,
  } as ViewStyle,

  vehicleName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: 'bold',
  } as TextStyle,

  vehicleModel: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,

  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  } as ViewStyle,

  selectedBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: 'bold',
  } as TextStyle,

  // Details styles
  detailsContainer: {
    padding: spacing.lg,
  } as ViewStyle,

  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  } as TextStyle,

  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as ViewStyle,

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,

  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,

  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,

  // Specs grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as ViewStyle,

  specCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    width: '48%',
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  } as ViewStyle,

  specValue: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  } as TextStyle,

  specLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  } as TextStyle,

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  } as ViewStyle,

  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  } as ViewStyle,
});

export default GarageScreen;