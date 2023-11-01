package edu.eci.arsw.typefight;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"edu.eci.arsw.typefight"})
public class TypeFightApplication {

	public static void main(String[] args) {
		SpringApplication.run(TypeFightApplication.class, args);
	}
}
