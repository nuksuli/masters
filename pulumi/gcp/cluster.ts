import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as k8s from "@pulumi/kubernetes";
import { ServiceProps, service } from "./service";

const config = new pulumi.Config();
const nodepool = config.require("node-pool");
const name = config.require("name");
const frontendProps = config.requireObject<ServiceProps>("frontend");
const backendProps = config.requireObject<ServiceProps>("backend");

const cluster = new gcp.container.Cluster(name, {
  removeDefaultNodePool: true,
  initialNodeCount: 1,
});

const clusterPreemptibleNodes = new gcp.container.NodePool(name, {
  name: nodepool,
  cluster: cluster.name,

  nodeCount: 1,
  nodeConfig: {
    preemptible: true,
    machineType: "e2-micro",
  },
});

export const kubeconfig = pulumi
  .all([cluster.name, cluster.endpoint, cluster.masterAuth])
  .apply(([name, endpoint, masterAuth]) => {
    const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${masterAuth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: Install gke-gcloud-auth-plugin for use with kubectl by following
        https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke
      provideClusterInfo: true
`;
  });

// Create a Kubernetes provider instance that uses our cluster from above.
const clusterProvider = new k8s.Provider(name, {
  kubeconfig: kubeconfig,
});

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, { provider: clusterProvider });

// Export the Namespace name
export const namespaceName = ns.metadata.apply((m) => m.name);

export const nodeId = clusterPreemptibleNodes.id;

const defaultProps = {
  clusterProvider,
  namespace: namespaceName,
};

export const backend = service({
  ...defaultProps,
  serviceProps: backendProps,
  name: `${name}-backend`,
  nodepool,
});

export const frontend = service({
  ...defaultProps,
  serviceProps: frontendProps,
  name: `${name}-frontend`,
  nodepool,
});
