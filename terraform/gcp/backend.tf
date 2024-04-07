resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "terraform-backend"
    namespace = kubernetes_namespace.terraform-gcp.metadata[0].name
    labels = {
      test = "backend-application"
    }
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        test = "backend-application"
      }
    }

    template {
      metadata {
        labels = {
          test = "backend-application"
        }
      }

      spec {
        container {
          name  = "backend-container"
          image = "eu.gcr.io/<project-id>/backend:latest"
          port {
            container_port = 3000
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 3000
            }
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 3000
            }
          }
        }

        node_name = "${var.project_id}-gke"
      }
    }
  }
}

resource "kubernetes_service" "backend" {
  metadata {
    name      = "terraform-backend"
    namespace = kubernetes_namespace.terraform-gcp.metadata[0].name
  }

  spec {
    selector = {
      test = "backend-application"
    }
    type = "LoadBalancer"
    port {
      port      = 80
      node_port = 3000
    }
  }
}
