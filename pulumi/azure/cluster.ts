import * as pulumi from "@pulumi/pulumi";
import * as azureNative from "@pulumi/azure-native";
import * as k8s from "@pulumi/kubernetes";
import { ServiceProps, service } from "./service";

const config = new pulumi.Config();
const nodePoolName = config.require("node-pool");
const name = config.require("name");
const frontendProps = config.requireObject<ServiceProps>("frontend");
const backendProps = config.requireObject<ServiceProps>("backend");

// Create an Azure resource group
const resourceGroup = new azureNative.resources.ResourceGroup(`${name}-rg`);

// Create an AKS cluster
const cluster = new azureNative.containerservice.ManagedCluster(`${name}-aks`, {
  resourceGroupName: resourceGroup.name,
  agentPoolProfiles: [{
    count: 1,
    vmSize: "Standard_DS2_v2",
    mode: "System",
    name: nodePoolName,
    osType: "Linux",
  }],
  dnsPrefix: `${name}-kube`,
  linuxProfile: {
    adminUsername: "azureuser",
    ssh: {
      publicKeys: [{
        keyData: config.require("sshPublicKey"),
      }],
    },
  },
  identity: {
    type: "SystemAssigned",
  },
});

// Get the Kubeconfig
const creds = pulumi.all([resourceGroup.name, cluster.name]).apply(([rgName, clusterName]) =>
  azureNative.containerservice.listManagedClusterUserCredentials({
    resourceGroupName: rgName,
    resourceName: clusterName,
  }),
);

const kubeconfig = creds.apply(creds => Buffer.from(creds.kubeconfigs[0].value, 'base64').toString());

// Create a Kubernetes provider instance that uses our cluster from above
const clusterProvider = new k8s.Provider(`${name}-aks-provider`, {
  kubeconfig: kubeconfig,
});

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, { provider: clusterProvider });

// Export the Namespace name
export const namespaceName = ns.metadata.apply(m => m.name);

const defaultProps = {
  clusterProvider,
  namespace: namespaceName,
};

export const backend = service({
  ...defaultProps,
  serviceProps: backendProps,
  name: `${name}-backend`,
  nodePoolName,
});

export const frontend = service({
  ...defaultProps,
  serviceProps: frontendProps,
  name: `${name}-frontend`,
  nodePoolName,
});