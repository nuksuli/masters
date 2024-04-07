import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const config = new pulumi.Config();
const password = config.requireSecret("password");

const instance = new gcp.sql.DatabaseInstance("instance", {
  region: "europe-west6",
  databaseVersion: "MYSQL_8_0",
  settings: {
    tier: "db-f1-micro",
  },
  rootPassword: password,
  deletionProtection: false,
});

const database = new gcp.sql.Database("database", {
  instance: instance.name,
});

export const databaseName = database.selfLink;