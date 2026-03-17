import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions } from '@/hooks/auth/use-auth-actions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoggingIn } = useAuthActions();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) return;
        try {
            // Mock deviceId or get it from Constants
            const deviceId = 'mobile-device'; 
            await login({ email, password, deviceId });
        } catch (error) {
            // Error is handled in hook
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ThemedView style={styles.header}>
                    <View style={styles.logoContainer}>
                        <IconSymbol name="house.fill" size={60} color="#0a7ea4" />
                    </View>
                    <ThemedText type="title" style={styles.title}>Welcome Back</ThemedText>
                    <ThemedText style={styles.subtitle}>Enter your credentials to access your account</ThemedText>
                </ThemedView>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Email</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="m@example.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.passwordHeader}>
                            <ThemedText style={styles.label}>Password</ThemedText>
                            <TouchableOpacity>
                                <ThemedText style={styles.forgotPassword}>Forgot password?</ThemedText>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isLoggingIn && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Sign In</ThemedText>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <ThemedText>Don't have an account? </ThemedText>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                            <ThemedText style={styles.link}>Join now</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        backgroundColor: 'transparent',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0a7ea415',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        paddingHorizontal: 20,
    },
    form: {
        gap: 20,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    forgotPassword: {
        fontSize: 12,
        color: '#666',
    },
        button: {
        backgroundColor: '#0a7ea4',
        height: 54,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
        boxShadow: '0 4px 12px rgba(10, 126, 164, 0.2)',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    link: {
        color: '#0a7ea4',
        fontWeight: 'bold',
    },
});
