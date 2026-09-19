package com.ridelink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RidelinkBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RidelinkBackendApplication.class, args);
	}

}
