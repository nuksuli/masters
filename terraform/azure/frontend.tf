resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "terraform-frontend"
    namespace = kubernetes_namespace.terraform_azure.metadata[0].name
    labels = {
      test = "frontend-application"
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        test = "frontend-application"
      }
    }

    template {
      metadata {
        labels = {
          test = "frontend-application"
        }
      }

      spec {
        container {
          name  = "frontend-container"
          image = "myacr.azurecr.io/frontend:latest"
          port {
            container_port = 80
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80
            }
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
          }
        }

        node_selector = {
          "agentpool" = "<node-pool-name>"
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "terraform-frontend"
    namespace = kubernetes_namespace.terraform_azure.metadata[0].name
  }

  spec {
    selector = {
      test = "frontend-application"
    }
    type = "LoadBalancer"

    port {
      port        = 80
      target_port = 80
    }
  }
}
