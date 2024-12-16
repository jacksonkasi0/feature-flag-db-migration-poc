# Zero-Downtime PostgreSQL Migration 🚀

This project demonstrates how to migrate a high-transaction PostgreSQL database from a self-hosted environment to a cloud-based solution **without any downtime or data loss**.

## Overview 📝

We leverage **DevCycle's feature flags** and **Drizzle ORM** to:

- **Dual Write Operations**: Write to both old and new databases simultaneously.
- **Conditional Read Operations**: Gradually switch reads from the old database to the new one for specific user groups.
- **Zero Downtime**: Maintain uninterrupted service during the migration.

## Features 🌟

- **Flexibility**: Toggle database operations without redeploying.
- **Control**: Direct specific user groups to the new database.
- **Safety**: Quickly revert to the old database if needed.
- **Performance**: Ensure data consistency and reliability.

## Getting Started 🛠️

### Prerequisites

- **Node.js**
- **PostgreSQL**
- **DevCycle Account**
- **Drizzle ORM**

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/jacksonkasi0/geo-feature-flag-db-migration.git
   ```

2. **Navigate to the server app**:

   ```bash
   cd geo-feature-flag-db-migration/apps/server
   ```

3. **Install dependencies**:

   ```bash
   deno install
   ```

### Configuration

1. **Set up DevCycle feature flags**:

   - Create `write` and `read` boolean flags.
   - Define user groups and conditions based on your requirements.

2. **Update environment variables**:

   - Add your DevCycle SDK key.
   - Configure database connection strings for both old and new databases.

### Running the Application

Start the server:

```bash
deno task dev
```

## Usage 🚴

- The application evaluates feature flags to determine database operations.
- **Write Operations**:
  - If `writeToNewDB` is `true`, writes go to both databases.
  - Otherwise, writes go only to the old database.
- **Read Operations**:
  - If `readFromNewDB` is `true`, reads come from the new database.
  - Otherwise, reads come from the old database.

## Roadmap 🛣️

- **Under Development**:
  - Automating data synchronization with PostgreSQL's Publish-Subscribe feature.
  - Building Docker containers and scripts for automation.

## Contributing 🤝

Contributions are welcome! Please open an issue or submit a pull request.

## License 📄

This project is licensed under the MIT License.

---

Feel free to explore the [GitHub repository](https://github.com/jacksonkasi0/geo-feature-flag-db-migration) for more details.

---

Happy coding! 😊🚀
