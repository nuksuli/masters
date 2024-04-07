resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "terraform-frontend"
    namespace = kubernetes_namespace.terraform-gcp.metadata[0].name
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
          image = "eu.gcr.io/<project-id>/frontend:latest"
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

        node_name = "${var.project_id}-gke"
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "terraform-frontend"
    namespace = kubernetes_namespace.terraform-gcp.metadata[0].name
  }

  spec {
    selector = {
      test = "frontend-application"
    }
    type = "LoadBalancer"
    port {
      port      = 80
      node_port = 80
    }
  }
}
