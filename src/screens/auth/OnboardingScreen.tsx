import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Animated, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Smart Solutions',
    subtitle: 'Protect what matters most with cutting-edge SK Technology CCTV and Smart Home systems.',
    image: require('../../../assets/images/sk_onboarding_1.png'),
  },
  {
    id: '2',
    title: 'Professional Installation',
    subtitle: 'Our certified technicians ensure seamless and aesthetic installations for maximum security.',
    image: require('../../../assets/images/sk_onboarding_2.png'),
  },
  {
    id: '3',
    title: 'Real-Time Tracking',
    subtitle: 'Monitor your service requests and view your active camera feeds directly from your phone.',
    image: require('../../../assets/images/sk_onboarding_3.png'),
  },
  {
    id: '4',
    title: 'Shop Premium Products',
    subtitle: 'Explore CCTV cameras, networking equipment, biometric devices, and accessories from trusted brands.',
    image: require('../../../assets/images/sk_onboarding_4.png'),
  },
  {
    id: '5',
    title: "Let's Get Started",
    subtitle: 'Create an account or sign in to access SK Technology services, products, and support.',
    image: require('../../../assets/images/sk_onboarding_5.png'),
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const completeOnboarding = async (targetScreen: string) => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      navigation.replace(targetScreen);
    } catch (e) {
      console.error('Failed to save onboarding status.', e);
    }
  };

  const scrollToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      slidesRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const renderItem = ({ item, index }: any) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp' });
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

    return (
      <View style={s.slide}>
        <Animated.Image source={item.image} style={[s.image, { transform: [{ scale }] }]} />
        <View style={s.textContainer}>
          <Animated.Text style={[s.title, { opacity }]}>{item.title}</Animated.Text>
          <Animated.Text style={[s.subtitle, { opacity }]}>{item.subtitle}</Animated.Text>

          {item.id === '5' && (
            <View style={s.actionContainer}>
              <TouchableOpacity style={s.primaryBtn} onPress={() => completeOnboarding('Login')} activeOpacity={0.8}>
                <Text style={s.primaryBtnText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryBtn} onPress={() => completeOnboarding('Register')} activeOpacity={0.8}>
                <Text style={s.secondaryBtnText}>Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={() => completeOnboarding('Main')}>
                <Text style={s.linkBtnText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <FlatList
        ref={slidesRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          if (index !== currentIndex) setCurrentIndex(index);
        }}
      />

      <View style={s.bottomContainer}>
        {currentIndex < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity onPress={() => completeOnboarding('Main')} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
            
            <View style={s.indicatorContainer}>
              {SLIDES.map((_, i) => {
                const dotWidth = scrollX.interpolate({
                  inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                  inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                return <Animated.View style={[s.dot, { width: dotWidth, opacity }]} key={i.toString()} />;
              })}
            </View>

            <TouchableOpacity onPress={scrollToNext} style={s.nextBtn}>
              <Text style={s.nextText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.indicatorContainerCenter}>
            {SLIDES.map((_, i) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [8, 20, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              return <Animated.View style={[s.dot, { width: dotWidth, opacity }]} key={i.toString()} />;
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  slide: { width, height, alignItems: 'center', justifyContent: 'center' },
  image: { width: width, height: height * 0.6, resizeMode: 'contain', position: 'absolute', top: Platform.OS === 'ios' ? 40 : 20 },
  textContainer: { position: 'absolute', bottom: 0, width: width, minHeight: height * 0.45, backgroundColor: '#0f172a', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingTop: 40, paddingBottom: 100, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  actionContainer: { width: '100%', marginTop: 24, gap: 12 },
  primaryBtn: { backgroundColor: Colors.primary, width: '100%', paddingVertical: 16, borderRadius: 24, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#1e293b', width: '100%', paddingVertical: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkBtn: { paddingVertical: 12, alignItems: 'center' },
  linkBtnText: { color: Colors.primaryLight, fontSize: 14, fontWeight: '700' },
  
  bottomContainer: { position: 'absolute', bottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 32 },
  indicatorContainer: { flexDirection: 'row', gap: 8 },
  indicatorContainerCenter: { flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'center', marginTop: 10 },
  dot: { height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  skipBtn: { paddingVertical: 10 },
  skipText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  nextBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  nextText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
