import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const password = config.requireSecret("password");

const dbSubnetGroupName = new aws.rds.SubnetGroup("dbSubnetGroup", {
    subnetIds: [
        "subnet-123456", // Replace with your actual subnet IDs
        "subnet-654321", // Replace with your actual subnet IDs
    ],
});

const instance = new aws.rds.Instance("instance", {
    engine: "mysql",
    engineVersion: "8.0",
    instanceClass: "db.t2.micro",
    allocatedStorage: 20,
    dbSubnetGroupName: dbSubnetGroupName.name,
    password: password,
    skipFinalSnapshot: true,
});

export const instanceEndpoint = instance.endpoint;
export const instanceName = instance.id;