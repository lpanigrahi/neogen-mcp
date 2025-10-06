import { Client } from "pg";
import { config } from "dotenv";

config();

async function setupPostgresUser() {
  console.log("🔧 Setting up PostgreSQL user...\n");

  // Try to connect as postgres user first to create the neogen user
  const adminClient = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: "postgres",
    // Try without password first (peer/trust auth)
  });

  try {
    await adminClient.connect();
    console.log("✅ Connected as postgres user\n");

    // Check if user exists
    const userCheck = await adminClient.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'neogen'",
    );

    if (userCheck.rows.length === 0) {
      console.log('Creating user "neogen"...');
      await adminClient.query(
        `CREATE USER neogen WITH PASSWORD 'Aayan:India@123'`,
      );
      console.log('✅ User "neogen" created');
    } else {
      console.log('ℹ️  User "neogen" already exists');
      // Update password just in case
      await adminClient.query(
        `ALTER USER neogen WITH PASSWORD 'Aayan:India@123'`,
      );
      console.log('✅ Password updated for user "neogen"');
    }

    // Grant privileges
    await adminClient.query(`ALTER USER neogen CREATEDB`);
    await adminClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE postgres TO neogen`,
    );
    console.log("✅ Privileges granted\n");

    await adminClient.end();

    // Now test connection with neogen user
    const testClient = new Client({
      host: "localhost",
      port: 5432,
      user: "neogen",
      password: "Aayan:India@123",
      database: "postgres",
    });

    await testClient.connect();
    console.log('✅ Successfully connected as "neogen" user!');
    await testClient.end();

    console.log("\n✨ Setup complete! You can now run: pnpm db:migrate");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\n📝 Manual Setup Required:");
    console.error("Run the following command in a new terminal:\n");
    console.error(
      "  sudo -u postgres psql -c \"CREATE USER neogen WITH PASSWORD 'Aayan:India@123' CREATEDB;\"",
    );
    console.error(
      '  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE postgres TO neogen;"',
    );
    process.exit(1);
  }
}

setupPostgresUser();
