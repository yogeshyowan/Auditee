# Auditee — Self-hosted Enterprise Helm chart

Stub chart for air-gapped, VPC and on-prem installs of the Auditee compliance / PDLC platform. The chart is intentionally minimal — production installs are supplied with a customer-pinned `values.yaml` by the Auditee solutions team.

## Components

| Component | Purpose |
|---|---|
| `auditee-api` | Node API server — REST + auth + audit log + SIEM dispatch |
| `auditee-web` | Static React frontend (eltegra-site) |
| `Ingress` | Path-based routing (`/api` → api, `/` → web) |
| `HorizontalPodAutoscaler` | CPU-based scaling for the API |
| `PodDisruptionBudget` | Maintain quorum during voluntary disruptions |
| `NetworkPolicy` | Restrict ingress to the ingress controller; allow DNS + 443 + 5432 egress |
| `ServiceMonitor` | Optional Prometheus scrape |

## Requirements

- Kubernetes ≥ 1.27
- An ingress controller (NGINX or equivalent)
- A reachable PostgreSQL 14+ cluster (managed RDS or in-cluster)
- An S3-compatible object store (AWS S3, MinIO, Ceph RGW)
- A KMS provider for customer-managed keys (AWS KMS, GCP KMS, Azure Key Vault, Vault Transit)
- A mirror image registry reachable from the cluster (for air-gapped installs)

## Quick start

```bash
# 1. Mirror images into your customer-supplied registry
docker pull auditee/api-server:2026.05.0
docker pull auditee/web:2026.05.0
docker tag  auditee/api-server:2026.05.0 registry.example.internal/auditee/api-server:2026.05.0
docker tag  auditee/web:2026.05.0        registry.example.internal/auditee/web:2026.05.0
docker push registry.example.internal/auditee/api-server:2026.05.0
docker push registry.example.internal/auditee/web:2026.05.0

# 2. Create namespace + secrets
kubectl create namespace auditee
kubectl -n auditee create secret docker-registry auditee-registry \
  --docker-server=registry.example.internal \
  --docker-username=… --docker-password=…
kubectl -n auditee create secret generic auditee-api-secrets \
  --from-literal=DATABASE_URL='postgres://…' \
  --from-literal=SESSION_SECRET="$(openssl rand -hex 32)" \
  --from-literal=AWS_ACCESS_KEY_ID='…' \
  --from-literal=AWS_SECRET_ACCESS_KEY='…'

# 3. Install
helm upgrade --install auditee deploy/helm/auditee \
  --namespace auditee \
  --set global.imageRegistry=registry.example.internal \
  --set ingress.hosts[0].host=auditee.example.internal
```

## Where to next

- Trust Center: https://auditee.site/trust
- Security whitepaper: https://auditee.site/security-whitepaper
- Self-host runbook + sizing guide: request via https://auditee.site/contact?topic=self-host

## Support

Enterprise customers receive a named CSM and 24×7 P1 paging — see your MSA.
