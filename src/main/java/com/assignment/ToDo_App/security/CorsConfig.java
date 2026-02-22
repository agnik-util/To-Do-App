package com.assignment.ToDo_App.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer webMvcConfigurer(){
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        // 1. Add OPTIONS to allowed methods for pre-flight requests
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        // 2. Explicitly allow your frontend ports
                        .allowedOrigins("http://127.0.0.1:5500", "http://localhost:5500")
                        // 3. CRUCIAL: Allow all headers so the 'Authorization' token passes through
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

}
