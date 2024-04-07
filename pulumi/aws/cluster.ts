import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import { ServiceProps, service } from "./service";

const config = new pulumi.Config();
const nodeGroupName = config.require("node-group-name");
const clusterName = config.require("name");
const frontendProps = config.requireObject<ServiceProps>("frontend");
const backendProps = config.requireObject<ServiceProps>("backend");

// Create an EKS cluster
const cluster = new eks.Cluster(clusterName, {
    instanceType: "t3.micro",
    desiredCapacity: 1,
    minSize: 1,
    maxSize: 2,
    deployDashboard: false,
});

export const kubeconfig = cluster.kubeconfig;

// Create a Kubernetes provider instance that uses our cluster from above.
const clusterProvider = new k8s.Provider(clusterName, {
    kubeconfig: cluster.kubeconfig,
});

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(clusterName, {}, { provider: clusterProvider });

// Export the Namespace name
export const namespaceName = ns.metadata.apply((m) => m.name);

export const nodeId = cluster.core.instanceType;

const defaultProps = {
    clusterProvider,
    namespace: namespaceName,
};

export const backend = service({
    ...defaultProps,
    serviceProps: backendProps,
    name: `${clusterName}-backend`,
    nodeGroupName,
});

export const frontend = service({
    ...defaultProps,
    serviceProps: frontendProps,
    name: `${clusterName}-frontend`,
    nodeGroupName,
});