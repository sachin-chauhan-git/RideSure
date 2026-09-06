package com.ridehail.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enables a simple in-memory broker with prefix /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages that are bound for @MessageMapping methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main STOMP WebSocket endpoint with SockJS fallback
        registry.addEndpoint("/ws-ride")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Plain WebSocket endpoint for non-sockjs clients
        registry.addEndpoint("/ws-ride")
                .setAllowedOriginPatterns("*");
    }
}
