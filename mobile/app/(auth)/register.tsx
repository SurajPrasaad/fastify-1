import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthActions } from '@/hooks/auth/use-auth-actions';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register, isRegistering } = useAuthActions();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !username || !email || !password) return;
        try {
            await register({ name, username, email, password });
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
                        <IconSymbol name="plus.circle.fill" size={60} color="#0a7ea4" />
                    </View>
                    <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
                    <ThemedText style={styles.subtitle}>Join our platform today and connect with others</ThemedText>
                </ThemedView>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Full Name</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Username</ThemedText>
                        <TextInput
                            style={styles.input}
                            placeholder="johndoe"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

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
                        <ThemedText style={styles.label}>Password</ThemedText>
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
                        style={[styles.button, isRegistering && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isRegistering}
                    >
                        {isRegistering ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <ThemedText>Already have an account? </ThemedText>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
                            <ThemedText style={styles.link}>Login</ThemedText>
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
        paddingTop: 60,
        paddingBottom: 40,
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
        gap: 16,
    },
    inputContainer: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
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
