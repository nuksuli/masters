import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

export type ServiceProps = {
  replicas: number;
  image: string;
  service: {
    internalPort: number;
    externalPort: number;
  };
};

interface IBackendProps {
  name: string;
  namespace: pulumi.Output<string>;
  clusterProvider: k8s.Provider;
  serviceProps: ServiceProps;
  nodepool: string;
}

export const service = ({
  name,
  namespace,
  clusterProvider,
  serviceProps,
  nodepool,
}: IBackendProps) => {
  const { replicas, image, service } = serviceProps;
  const appLabels = {
    appClass: name,
  };

  const deployment = new k8s.apps.v1.Deployment(
    name,
    {
      metadata: {
        namespace: namespace,
        labels: appLabels,
      },
      spec: {
        replicas: replicas,
        selector: {
          matchLabels: appLabels,
        },
        template: {
          metadata: {
            labels: appLabels,
          },
          spec: {
            containers: [
              {
                name: name,
                image,
                ports: [
                  {
                    containerPort: service.internalPort,
                  },
                ],
                livenessProbe: {
                  httpGet: {
                    path: "/",
                    port: service.internalPort,
                  },
                },
                readinessProbe: {
                  httpGet: {
                    path: "/",
                    port: service.internalPort,
                  },
                },
              },
            ],
            nodeSelector: {
              "cloud.google.com/gke-nodepool": nodepool,
            },
          },
        },
      },
    },
    {
      provider: clusterProvider,
    }
  );

  const deploymentService = new k8s.core.v1.Service(
    name,
    {
      metadata: {
        namespace: namespace,
        name: name,
        labels: appLabels,
      },
      spec: {
        type: "LoadBalancer",
        ports: [
          {
            name: "http",
            protocol: "TCP",
            port: service.externalPort,
            targetPort: service.internalPort,
          },
        ],
        selector: appLabels,
      },
    },
    {
      provider: clusterProvider,
    }
  );

  return {
    deploymentId: deployment.id,
    servicePublicIP: deploymentService.status.apply((s) =>
      s.loadBalancer.ingress ? s.loadBalancer.ingress[0].ip : undefined
    ),
  };
};
