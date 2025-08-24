import { useState, useEffect, useRef } from 'react';
import { WebPubSubClient } from '@azure/web-pubsub-client';

export const useWebPubSub = (userId, userRole) => {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const clientRef = useRef(null);
    
    useEffect(() => {
        const connectToWebPubSub = async () => {
            try {
                // Get connection token from negotiate function
                const response = await fetch('/api/negotiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'x-user-role': userRole
                    }
                });
                
                const { url } = await response.json();
                
                // Create WebPubSub client
                const client = new WebPubSubClient(url);
                clientRef.current = client;
                
                // Event handlers
                client.on('connected', () => {
                    console.log('Connected to Manufacturing Hub');
                    setIsConnected(true);
                });
                
                client.on('disconnected', () => {
                    console.log('Disconnected from Manufacturing Hub');
                    setIsConnected(false);
                });
                
                client.on('server-message', (e) => {
                    const message = JSON.parse(e.message.data);
                    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
                });
                
                // Connect
                await client.start();
                
            } catch (error) {
                console.error('WebPubSub connection error:', error);
            }
        };
        
        if (userId && userRole) {
            connectToWebPubSub();
        }
        
        // Cleanup
        return () => {
            if (clientRef.current) {
                clientRef.current.stop();
            }
        };
    }, [userId, userRole]);
    
    const sendMessage = async (message) => {
        if (clientRef.current && isConnected) {
            await clientRef.current.sendEvent('message', message, 'json');
        }
    };
    
    return {
        isConnected,
        messages,
        sendMessage
    };
};