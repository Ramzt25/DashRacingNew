import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, typography, spacing } from '../utils/theme';
import Button from './common/Button';

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, actions } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Show loading screen during initialization
  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>DASH RACING</Text>
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login screen if not authenticated
  if (!state.isAuthenticated || !state.user) {
    const handleSignIn = async () => {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }
      
      setIsAuthenticating(true);
      try {
        const result = await actions.signIn(email, password);
        if (!result.success) {
          Alert.alert('Error', result.error || 'Invalid email or password');
        }
      } catch (error) {
        console.error('Sign in error:', error);
        Alert.alert('Error', 'Failed to sign in. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    };

    const handleSignUp = async () => {
      if (!email || !password || !username) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters');
        return;
      }
      
      if (username.length < 3) {
        Alert.alert('Error', 'Username must be at least 3 characters');
        return;
      }
      
      setIsAuthenticating(true);
      try {
        const result = await actions.signUp(email, password, username);
        if (!result.success) {
          Alert.alert('Error', result.error || 'Failed to create account. Please try again.');
        }
      } catch (error) {
        console.error('Sign up error:', error);
        Alert.alert('Error', 'Failed to create account. Please try again.');
      } finally {
        setIsAuthenticating(false);
      }
    };

    if (showLogin) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.authContainer}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>DASH RACING</Text>
            <Text style={styles.tagline}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </Text>
            
            <View style={styles.authForm}>
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={colors.textTertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <Button
                title={isAuthenticating ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
                onPress={isSignUp ? handleSignUp : handleSignIn}
                variant="primary"
                size="large"
                fullWidth
                disabled={isAuthenticating}
                style={styles.button}
              />
              
              <Button
                title={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setUsername('');
                }}
                variant="secondary"
                size="large"
                fullWidth
                style={styles.button}
              />
              
              <Button
                title="Back"
                onPress={() => {
                  setShowLogin(false);
                  setEmail('');
                  setPassword('');
                  setUsername('');
                  setIsSignUp(false);
                }}
                variant="ghost"
                size="medium"
                style={styles.backButton}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>DASH RACING</Text>
          <Text style={styles.tagline}>Race Anywhere, Meet Anywhere</Text>
          
          <View style={styles.authButtons}>
            <Button
              title="Sign In"
              onPress={() => setShowLogin(true)}
              variant="primary"
              size="large"
              fullWidth
              style={styles.button}
            />
            
            <Button
              title="Create Account"
              onPress={() => {
                setIsSignUp(true);
                setShowLogin(true);
              }}
              variant="secondary"
              size="large"
              fullWidth
              style={styles.button}
            />
          </View>
          
          <Text style={styles.welcomeText}>
            Join the ultimate racing community and compete with drivers worldwide
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // User is authenticated, show main app
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: spacing.lg,
  },
  brandName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    ...typography.bodySecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    color: colors.textSecondary,
  },
  authButtons: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  authForm: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    marginBottom: spacing.md,
  },
  backButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  welcomeText: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.textTertiary,
    lineHeight: 18,
  },
  loader: {
    marginVertical: spacing.lg,
  },
  loadingText: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  },
});

export default AuthWrapper;