import * as pulumi from "@pulumi/pulumi";
import * as azureNative from "@pulumi/azure-native";

const config = new pulumi.Config();
const password = config.requireSecret("password");

const resourceGroup = new azureNative.resources.ResourceGroup("resourceGroup");

const server = new azureNative.dbforMySQL.Server("server", {
    resourceGroupName: resourceGroup.name,
    properties: {
        createMode: "Default",
        administratorLoginPassword: password,
        storageProfile: {
        },
        sku: {
            tier: "Basic",
            family: "Gen5",
            capacity: 1,
        },
    },
});

const database = new azureNative.dbforMySQL.Database("database", {
    resourceName: server.name,
    resourceGroupName: resourceGroup.name,
    charset: "utf8",
    collation: "utf8_general_ci",
});

export const databaseName = database.name;
export const databaseId = database.id;