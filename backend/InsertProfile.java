import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class InsertProfile {
    public static void main(String[] args) throws Exception {
        String url = System.getenv("DB_URL");
        String user = System.getenv("DB_USER");
        String password = System.getenv("DB_PASSWORD");
        
        try (Connection conn = DriverManager.getConnection(url, user, password)) {
            String sql = "INSERT INTO patient_profiles (user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, branch_id) " +
                         "VALUES (15, '2000-01-01', 'Other', 'Self', '+1000000000', 1) " +
                         "ON CONFLICT DO NOTHING";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                int rows = stmt.executeUpdate();
                System.out.println("Rows inserted: " + rows);
            }
        }
    }
}
