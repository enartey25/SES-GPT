package com.sesgpt;

import com.sesgpt.model.Announcement;
import com.sesgpt.model.Role;
import com.sesgpt.model.User;
import com.sesgpt.repository.AnnouncementRepository;
import com.sesgpt.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class SesGptApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(SesGptApplication.class, args);
    }

    private static void loadDotEnv() {
        List<Path> potentialPaths = List.of(
                Paths.get(".env"),
                Paths.get("../.env"),
                Paths.get("../../.env")
        );
        for (Path path : potentialPaths) {
            if (Files.exists(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String value = line.substring(eq + 1).trim();
                            if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
                                value = value.substring(1, value.length() - 1);
                            } else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }

    @Bean
    public CommandLineRunner seedDemoData(
            UserRepository userRepository,
            AnnouncementRepository announcementRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            String encodedPass = passwordEncoder.encode("password123");

            // Seed Demo Users (all verified so user can test immediately)
            User student = userRepository.findByStudentId("10671234").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("10671234")
                        .name("Ama Owusu")
                        .email("ama.owusu@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.STUDENT)
                        .department("Computer Engineering")
                        .level("L300")
                        .verified(true)
                        .active(true)
                        .build())
            );
            if (!student.isVerified()) {
                student.setVerified(true);
                userRepository.save(student);
            }

            userRepository.findByStudentId("22370498").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("22370498")
                        .name("Kwame Boateng")
                        .email("kboateng22@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.STUDENT)
                        .department("Computer Engineering")
                        .level("L300")
                        .verified(true)
                        .active(true)
                        .build())
            );

            userRepository.findByStudentId("TA-2024-01").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("TA-2024-01")
                        .name("Kofi Annan")
                        .email("kofi.annan.ta@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.TA)
                        .department("Computer Engineering")
                        .verified(true)
                        .active(true)
                        .build())
            );

            User lecturer = userRepository.findByStudentId("LEC-1002").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("LEC-1002")
                        .name("Dr. Godfrey Mills")
                        .email("gmills@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.LECTURER)
                        .department("Computer Engineering")
                        .verified(true)
                        .active(true)
                        .build())
            );

            userRepository.findByStudentId("HOD-CPEN").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("HOD-CPEN")
                        .name("Prof. Aba Bentil")
                        .email("abentil.hod@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.HOD)
                        .department("Computer Engineering")
                        .verified(true)
                        .active(true)
                        .build())
            );

            userRepository.findByStudentId("DEAN-ENG").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("DEAN-ENG")
                        .name("Prof. Elvis Nyarko")
                        .email("dean.engineering@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.DEAN)
                        .department("Dean's Office")
                        .verified(true)
                        .active(true)
                        .build())
            );

            userRepository.findByStudentId("ADM-001").orElseGet(() ->
                userRepository.save(User.builder()
                        .studentId("ADM-001")
                        .name("SES Admin Desk")
                        .email("admin.ses@ug.edu.gh")
                        .password(encodedPass)
                        .role(Role.ADMIN)
                        .department("Dean's Office")
                        .verified(true)
                        .active(true)
                        .build())
            );

            // Seed sample announcement if none exist
            if (announcementRepository.count() == 0) {
                announcementRepository.save(Announcement.builder()
                        .senderId(lecturer.getId())
                        .senderName(lecturer.getName())
                        .senderRole(lecturer.getRole().name().toLowerCase())
                        .title("CPEN 302: Mid-Semester Examination Schedule")
                        .body("The CPEN 302 mid-semester exam will take place on Friday, 10:00 AM at the Engineering Computer Lab. Please bring your student ID.")
                        .targetSchool("School of Engineering Sciences")
                        .targetDepartment("Computer Engineering")
                        .targetLevels(List.of("L300"))
                        .targetRoles(List.of("student"))
                        .reachCount(78)
                        .build());
            }
        };
    }
}
